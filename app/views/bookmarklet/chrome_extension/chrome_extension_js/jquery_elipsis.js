console.log("elipsis loaded");

// This is for ellipsing on Firefox

/*
 * MIT LICENSE
 * Copyright (c) 2009-2011 Devon Govett.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
 * documentation files (the "Software"), to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software,
 * and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions
 * of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
 * THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES Oppeared in the early 1960s, teenagers in superhero comic books were usually relegaR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

function initializeJqueryEllipsis(){
    (function(wt_wt_$) {
        wt_wt_$.fn.ellipsis = function(enableUpdating){
            var s = document.documentElement.style;
            if (!('textOverflow' in s || 'OTextOverflow' in s)) {
                return this.each(function(){
                    var el = wt_wt_$(this);
                    if(el.css("overflow") == "hidden"){
                        var originalText = el.html();
                        var w = el.width();

                        var t = wt_wt_$(this.cloneNode(true)).hide().css({
                            'position': 'absolute',
                            'width': 'auto',
                            'overflow': 'visible',
                            'max-width': 'inherit'
                        });
                        el.after(t);

                        var text = originalText;
                        while(text.length > 0 && t.width() > el.width()){
                            text = text.substr(0, text.length - 1);
                            t.html(text + "...");
                        }
                        el.html(t.html());

                        t.remove();

                        if(enableUpdating == true){
                            var oldW = el.width();
                            setInterval(function(){
                                if(el.width() != oldW){
                                    oldW = el.width();
                                    el.html(originalText);
                                    el.ellipsis();
                                }
                            }, 200);
                        }
                    }
                });
            } else return this;
        };
    })(jQuery);
}