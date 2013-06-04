class RemoteDocument
  require 'nokogiri'
  require 'net/http'
  require 'net/https'
  require 'fileutils'
  require 'uri'
  require 'open-uri'

  attr_reader :uri, :save_path, :bucket, :asset_path, :encoding, :src
  attr_reader :contents
  attr_reader :css_tags, :js_tags, :img_tags, :meta, :links



  def initialize(uri,html, iframe=false)
    begin
      @uri = URI(uri)
    rescue
      $stderr.puts('Page contains a bad URI:', uri, 'moving on.')
      @uri = 'javascript:void(false)'; # set this to this temp URL to not get handled
    end
    @is_iframe= iframe
    s3 = AWS::S3.new
    @bucket = s3.buckets["TrailsSitesProto"]
    @src = html
  end


  #=begin rdoc
  #Download, parse, and save the RemoteDocument and all resources (JS, CSS,
  #images) in the specified directory.
  #=end
  def mirror(dir,shallow_save=false)
    @shallow_save = shallow_save
    @dir = dir
    source = @src
    # $stderr.puts "mirror", @shallow_save, @dir
    @encoding = source.encoding.to_s
    @contents = Nokogiri::HTML( source, nil ,@encoding )
    process_contents
    # $stderr.puts "done processing contents"
    save_locally(dir)
  end


  #=begin rdoc
  #Extract resources (CSS, JS, Image files) from the parsed html document.
  #=end
  def process_contents
    # $stderr.puts "processing contents"
    @contents.xpath('//base').each do |base|
      if base.parent.node_name == "head"
        @uri = URI(base.attribute("href"))
      end
      if base.parent.node_name != "iframe"
        base.remove
      end
    end
    @iframe_srcs = []
    @contents.xpath('//iframe').each do |iframe|
      new_uri_base = iframe.attribute("src") || @uri.to_s
      iframe_doc = RemoteDocument.new(new_uri_base,iframe.inner_html, true)
      iframe_contents = iframe_doc.mirror(@dir,@shallow_save)
      @iframe_srcs.push(iframe_contents)
      iframe.inner_html=""
      iframe.set_attribute("src","")
    end

    @noscript_tags = @contents.xpath( '//noscript' )
    @js_tags = @contents.xpath('//script')
    @noscript_tags.each { |tag| tag.remove }
    @js_tags.each { |tag| tag.remove }

    css_parsed_src  = save_css_urls_to_s3(@contents.to_html,File.join(@dir,"images"),@uri)
    @contents = Nokogiri::HTML(css_parsed_src,nil,@encoding)

    @css_tags = @contents.xpath( '//link[@rel="stylesheet"]' )
    @img_tags = @contents.xpath( '//img[@src]' )
    @links = @contents.xpath( '//a[@href]' )
    convert_links_to_open_in_a_new_tab



    #find_meta_tags

  end


  #=begin rdoc
  #Extract contents of META tags to @meta Hash.
  #=end
  def find_meta_tags
    # $stderr.puts "finding meta tags"
    @meta = {}
    @contents.xpath('//meta').each do |tag|
      last_name = name = value = nil
      tag.attributes.each do |key, attr|
        if attr.name == 'content'
          value = attr.value
        elsif attr.name == 'name'
          name = attr.value
        else
          last_name = attr.value
        end
      end
      name = last_name if not name
      @meta[name] = value if name && value
    end
  end


  #=begin rdoc
  #Generate a Hash URL -> Title of all (unique) links in document.
  #=end
  def convert_links_to_open_in_a_new_tab
    # $stderr.puts "converting links to open in a new tab"
    @contents.xpath('//a[@href]').each do |tag|
      begin
        tag[:target] = "_blank"
        tag[:href] = url_for(tag[:href])
      rescue
        $stderr.puts("something broke while trying to make links open in a new tab")
      end
    end
    # $stderr.puts "converting links to open in a new tab End"
  end


  #=begin rdoc
  #Generate a local, legal filename for url in dir.
  #=end
  def localize_url(url, dir)
    # $stderr.puts "localizing url"
    path = url.gsub(/^[|[:alpha]]+:\/\//, '')
    path.gsub!(/^[.\/]+/, '')
    path.gsub!(/[^-_.\/[:alnum:]]/, '_')
    extension = File.extname(path)
    if !extension.empty?
      path_wo_extension = path[0..-(extension.length+1)]
    else
      path_wo_extension = path
    end
    short_path_wo_extension = path_wo_extension[0..100]
    short_path_wo_extension = short_path_wo_extension.gsub(/\/+$/,"")
    short_path_wo_extension = short_path_wo_extension.gsub(/\.\./,"")
    short_path_wo_extension = short_path_wo_extension.gsub(/\/\//,"/")
    File.join(dir, short_path_wo_extension + extension)
  end


  #=begin rdoc
  #Construct a valid URL for an HREF or SRC parameter. This uses the document URI
  #to convert a relative URL ('/doc') to an absolute one ('http://foo.com/doc').
  #=end
  def url_for(str)
    # $stderr.puts "url for a href"
    if @uri.scheme
      url_base = @uri.scheme + "://" +  @uri.host
    elsif @uri.host
      url_base = @uri.host
    else
      url_base = ""
    end

    return str if str =~ /^[|[:alpha:]]+:\/\//
    return (@uri.scheme+"://"+ str[2..-1]) if str =~ /^\/\//
    if str[0] != "/"
      return File.join(File.dirname(@uri.to_s),str) if @uri.path.index(".")
      return File.join(@uri.to_s,str)
    end
    File.join(url_base, str)
  end

  def relative_url_for(str,relative_dir)
    # $stderr.puts "relative url"
    relative_dir = relative_dir.to_s
    relative_uri = URI(relative_dir)
    if @uri.scheme
      url_base = @uri.scheme + "://" +  @uri.host
    elsif @uri.host
      url_base = @uri.host
    else
      url_base = ""
    end

    return str if str =~ /^[|[:alpha:]]+:\/\//
    return (relative_uri.scheme+"://"+ str[2..-1]) if str =~ /^\/\//
    if str[0] != "/"
      return File.join(File.dirname(relative_dir),str) if relative_uri.path.index(".")
      return File.join(relative_dir,str)
    end
    File.join(url_base, str)
  end


  #=begin rdoc
  #Send GET to url, following redirects if required.
  #=end
  def html_get_site(url)
    user_agent = "Mozilla/5.0 (X11; Ubuntu; Linux i686; rv:13.0) Gecko/20100101 Firefox/13.0"
    begin
      resp = open(url.to_s, "User-Agent" => user_agent)
      return resp.read
    rescue
      $stderr.puts url.to_s+" returned 400 or something"
      return false
    end
  end


  def parse_URI_or_return_false(url)
    uri = false
    begin
      uri = URI.parse(url)
    rescue
      $stderr.puts("something went very wrong, this url was probably completely invalid",url)
    end
    return uri
  end


  #=begin rdoc
  #Download a remote file and save it to the specified localized url path
  #=end
  def download_resource(url, path)
    the_uri = parse_URI_or_return_false(url)
    if the_uri
      data = html_get_site the_uri
      if data
        newFile = write_to_aws(data,path)
        return newFile
      end
    end
  end

# Make sure dir is localized_url'd
  def generate_AWS_URL(dir)
    "https://s3.amazonaws.com/TrailsSitesProto/"+dir
  end

  #=begin rdoc
  #Download resource for attribute 'sym' in 'tag' (e.g. :src in IMG), saving it to
  #'dir' and modifying the tag attribute to reflect the new, local location.
  #=end                                                                                                                        b
  def localize(tag, sym, dir)
    # $stderr.puts "localizing"

    url = tag[sym]
    resource_url = url_for(url)
    dest = localize_url(url, dir)
    if !@shallow_save
      s3File = download_resource(resource_url, dest)
      if s3File
        s3File.acl = :public_read
        tag[sym.to_s] = s3File.public_url().to_s
      end
    else
      tag[sym.to_s] = generate_AWS_URL(dest)
    end
  end

  def write_to_aws(data,localized_url)
    begin
      newFile = @bucket.objects[localized_url]
      newFile.write(data)
    rescue
      newFile = false
      $stderr.puts localized_url.to_s+"had a problem saving"
    end
    return newFile
  end

  def localize_css_recursively(tag, sym, dir)
    # $stderr.puts "localizing css recursively"
    url = tag[sym]
    resource_url = url_for(url)
    dest = localize_url(url, dir)
    if !@shallow_save
      css_string = html_get_site resource_url
      if css_string
        localized_css_string = save_css_urls_to_s3(css_string,dir,resource_url)
        newFile = false
        if localized_css_string
          newFile = write_to_aws(localized_css_string,dest)
        end
        if newFile
          newFile.acl = :public_read
          tag[sym] = newFile.public_url().to_s
        end
      end
    else
      tag[sym] = generate_AWS_URL(dest)
    end
  end

  def save_import_tags(string,dir, urls_already_saved=[])
    import_tag_start = string.index("@import")
    if import_tag_start
      everything_before_import_tag = string[0...import_tag_start+7]
      everything_after_import_tag = string[import_tag_start+7..-1]

      url_start = everything_after_import_tag =~ /'|"/
      new_line_index = everything_after_import_tag.index("\n") + import_tag_start
      if !url_start or !new_line_index or (url_start > new_line_index)
         new_string = everything_before_import_tag  + save_import_tags(everything_after_import_tag,dir)
      else
        everything_after_url_start = everything_after_import_tag[(url_start+1)..-1]
        url_end = everything_after_url_start =~ /'|"/
        everything_after_url = everything_after_url_start[url_end..-1]
        everything_before_url = everything_before_import_tag + everything_after_import_tag[0..url_start]
        url = everything_after_url_start[0...url_end]

        absolute_url = relative_url_for(url,dir)
        dest = localize_url(absolute_url,dir)
        new_url = url
        if !url.in?(urls_already_saved)
          if !@shallow_save
            #s3File = download_resource(absolute_url,dest)
            s3File = false
            $stderr.puts("actually got an import tag")
            css_string = html_get_site(absolute_url)
            if css_string
              urls_already_saved.push(absolute_url)
              css_string = save_css_urls_to_s3(css_string,dir,absolute_url,urls_already_saved)
              s3File = write_to_aws(css_string, dest)
            end
            if s3File
              s3File.acl = :public_read
              new_url = s3File.public_url().to_s
              urls_already_saved.push(new_url)
            end
          else
            new_url= generate_AWS_URL(dest)
          end
        end
        new_string = everything_before_url + new_url + save_import_tags(everything_after_url,dir,urls_already_saved)
    end
      return new_string
    else
      return string
    end
  end

  def save_css_urls_to_s3(css_string,dir,css_file_url,urls_already_saved = [])
    # $stderr.puts "saving css urls to s3"
    css_string = save_import_tags(css_string,dir, urls_already_saved)
    # $stderr.puts "Done with import tags and back to save css"
    beginning_of_url = css_string.index("url(")
    if beginning_of_url
      url_onward = css_string[beginning_of_url+4..-1]
      end_of_url = url_onward.index(")")
      if end_of_url != 0
        url = url_onward[0..end_of_url-1].gsub(/\s+/, "")
        url = url[1..-2] if ((url[0] == "'") or (url[0] == '"'))
        new_url = url
        if !url.index("data:") and !url.in?(urls_already_saved)
          source = relative_url_for(url,css_file_url)
          dest = localize_url(source,dir)
          if !@shallow_save
            #s3File = download_resource(source,dest)
            s3File = false
            data = html_get_site(source)
            if data
              if File.extname(source) == ".css"
                urls_already_saved.push(source)
                data = save_css_urls_to_s3(data,dir,source,urls_already_saved)
              end
              s3File = write_to_aws(data,dest)
            end
            if s3File
              s3File.acl = :public_read
              # $stderr.puts "public url save css", s3File.public_url()
              new_url = s3File.public_url().to_s
              urls_already_saved.push(new_url)
            end
          else
            # $stderr.puts "save css generate url for", dest
            new_url = generate_AWS_URL(dest)
          end
        end
      else
        # $stderr.puts "setting new url to empty"
        new_url = ""
      end
      first_half = css_string[0..beginning_of_url+3]
      second_half = save_css_urls_to_s3(url_onward[end_of_url..-1],dir,css_file_url,urls_already_saved)
      return (first_half + new_url + second_half)
    else
      return css_string
    end
  end

  #=begin rdoc
  #Attempt to "play nice" with web servers by sleeping for a few ms.
  #=end
  def delay
    sleep(rand / 100)
  end


  #=begin rdoc
  #Download all resources to destination directory, rewriting in-document tags
  #to reflect the new resource location, then save the localized document.
  #Creates destination directory if it does not exist.
  #=end
  def save_locally(dir)
    # $stderr.puts "saving locally"
    # remove HTML BASE tag if it exists
    @contents.xpath('//base').each { |t| t.remove }
    # save resources
    @img_tags.each { |tag| localize(tag, :src, File.join(dir, 'images')) }
    @css_tags.each { |tag| localize_css_recursively(tag, :href, File.join(dir, 'css')) }
    @contents.xpath('//iframe').each_with_index {|iframe,i| iframe.inner_html = @iframe_srcs[i] }

    if !@is_iframe
      @save_path = File.join(dir, File.basename(@uri.to_s))
      @save_path += '.html' if @save_path !~ /\.((html?)|(txt))$/
      newFile = write_to_aws(@contents.to_html.force_encoding(@encoding), localize_url(@save_path, dir))
      newFile.acl = :public_read
      @asset_path = newFile.public_url().to_s
      return true
    else
      return @contents.to_html
    end
  end
end