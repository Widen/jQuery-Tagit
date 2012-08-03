/*
 * INFORMATION
 * ---------------------------
 * Original Developer: Matthew Hailwood @ jquery.webspirited.com
 * Current Owner/Maintainer of this Forked Version: Widen Enterprises, Inc.
 * ---------------------------
 */

(function ($) {
    $.widget("ui.tagit", {

        // default options
        defaults:{
            //Maps directly to the jQuery-ui Autocomplete option
            tagSource:[],
            //What keys should trigger the completion of a tag
            triggerKeys:['enter', 'space', 'comma', 'tab'],
            //array method for setting initial tags
            initialTags:[],
            //minimum length of tags
            minLength:1,
            //should an html select be rendered to allow for normal form submission
            select:false,
            //if false only tags from `tagSource` are able to be entered
            allowNewTags:true,
            //should tag and Tag be treated as identical
            caseSensitive:false,
            //should tags be drag-and-drop sortable?
            //true: entire tag is draggable
            //'handle': a handle is rendered which is draggable
            sortable:false,
            //color to highlight text when a duplicate tag is entered
            highlightOnExistColor:'#0F0',
            //empty search on focus
            emptySearch:true,
            //callback function for when tags are changed
            //tagValue: value of tag that was changed
            //action e.g. removed, added, sorted
            tagsChanged:function (tagValue, action, element) {
                ;
            },
            maxTags:undefined,
            //should 'paste' event trigger 'blur', thus potentially adding a new tag
            // (true for backwards compatibility)
            blurOnPaste:true,
            //true to allow editing of text in an existing tag
            // (false for backwards compatibility)
            editOnClick:false,
            //true to receive a tagsChanged callback when adding initial tags
            // (false for backwards compatibility)
            callbackOnInitialTagAdd:false
        },

        _splitAt:/\ |,/g,
        _existingAtIndex:0,
        _keys:{
            backspace:[8],
            enter:[13],
            space:[32],
            comma:[44, 188],
            tab:[9],
            semicolon:[186, 59]
        },

        _sortable:{
            sorting:-1
        },

        _handlingEditTag: false,

        _handleEditTag: function($tagEl) {
            this._handlingEditTag = true;
            var index = $tagEl.index();
            var tagText = this.tags()[index].label;
            var editingTag = this.element.find('li.tagit-new');
            this.input.width($tagEl.width());
            this.input.autoGrowInput({comfortZone:10});
            $tagEl.before(editingTag)
                .remove();
            this.input.val(tagText)
                .data().editing = true;

            //to ensure the cursor is placed after the last character in IE, and ensure the value is not cleared after focusing
            setTimeout(function() {
                editingTag.find('input').focus().val(tagText);
            }, 400);

            clearTimeout(this.timer);
            this._handlingEditTag = false;
        },

        _handleUpdateEditedTag: function(tag) {
            var lastLi = this.element.children('li').last();
            if (lastLi.is(this.input.parent())) {
                tag.element.insertBefore(this.input.parent());
                tag.index -= 1;
                this.tagsArray[tag.index] = tag;
                this._popSelect($(this.tagsArray).last()[0]);
            }
            else {
                tag.index = this.input.parent().index();
                tag.element.insertBefore(this.input.parent());
                this.input.parent().insertAfter(lastLi);
                this.input.focus();
                this.tagsArray[tag.index] = tag;
                this._popSelect(tag);
            }
        },

        _handleDuplicateEditedTag: function(tag) {
            this._popTag(tag);

            var lastLi = this.element.children('li').last();
            if (!lastLi.is(this.input.parent())) {
                this.input.parent().insertAfter(lastLi);
                this.input.focus();
            }

            this.input.data().editing = false;
        },

        _initPasteSplitter: function() {
            var splitRegex = [];
            if ($.inArray('space', this.options.triggerKeys) > 0) {
                splitRegex.push(' ');
            }
            if ($.inArray('comma', this.options.triggerKeys) > 0) {
                splitRegex.push(',');
            }
            if ($.inArray('semicolon', this.options.triggerKeys) > 0) {
                splitRegex.push(';');
            }
            this._splitAt = new RegExp(splitRegex.join('|'));
        },

        //initialization function
        _create:function () {
            this.options = $.extend(this.defaults, this.options);
            var self = this;
            this.tagsArray = [];
            this.timer = null;

            //add class "tagit" for theming
            this.element.addClass("tagit");

            //add any initial tags added through html to the array
            this.element.children('li').each(function () {
                var tag = $(this);
                var tagValue = tag.attr('tagValue') || tag.data('value');
                self.options.initialTags.push({label:tag.text(), value:(tagValue ? tagValue : tag.text())});
            });

            this._initPasteSplitter();

            //add the html input
            this.element.html('<li class="tagit-new"><input class="tagit-input" type="text" /></li>');

            this.input = this.element.find(".tagit-input");

            //setup click handler
            $(this.element).click(function (e) {
                if ($(e.target).hasClass('tagit-close')) {
                    // Removes a tag when the little 'x' is clicked.
                    var parent = $(e.target).parent();

                    var tag = self.tagsArray[parent.index()];

                    tag.element.remove();
                    self._popTag(tag);
                }
                else {
                    self.input.focus();
                    if (self.options.emptySearch && $(e.target).hasClass('tagit-input') && self.input.val() == '' && self.input.autocomplete != undefined) {
                        self.input.autocomplete('search');
                    }
                    else if (self.options.editOnClick && $(e.target).hasClass('tagit-text')) {
                        self._handleEditTag($(e.target).parents('.tagit-choice'));
                    }
                }
            });

            //setup autocomplete handler
            var os = this.options.select;
            this.options.appendTo = this.element;
            this.options.source = this.options.tagSource;
            this.options.select = function (event, ui) {
                self.input.data('autoCompleteTag', true);
            clearTimeout(self.timer);
            if (self.options.maxTags !== undefined && self.tagsArray.length == self.options.maxTags) {
                self.input.val("");
            }
            else {
                if (ui.item.label === undefined)
                    self._addTag(ui.item.value);
                else
                    self._addTag(ui.item.label, ui.item.value);
            }

            return false;
        },

            this.options.focus = function (event, ui) {
                if (ui.item.label !== undefined && /^key/.test(event.originalEvent.originalEvent.type)) {
                    self.input.val(ui.item.label);
                    self.input.data('value', ui.item.value);
                    return false;
                }
            };
            this.options.autoFocus = !this.options.allowNewTags;
            this.input.autocomplete(this.options);
            this.options.select = os;

            //setup keydown handler
            this.input.keydown(function (e) {
                if (e.shiftKey) {
                    return;
                }

                var lastLi = self.element.children(".tagit-choice:last");
                if (e.which == self._keys.backspace)
                    return self._backspace(lastLi);

                if (self._isInitKey(e.which) && !(self._isTabKey(e.which) && this.value == '' && !self.input.data('autoCompleteTag'))) {
                    e.preventDefault();

                    self.input.data('autoCompleteTag', false);

                    if (!self.options.allowNewTags || (self.options.maxTags !== undefined && self.tagsArray.length == self.options.maxTags)) {
                        self.input.val("");
                    }
                    else if (self.options.allowNewTags && $(this).val().length >= self.options.minLength) {
                        self._addTag($(this).val());
                    }
                }

                if (self.options.maxLength !== undefined && self.input.val().length == self.options.maxLength) {
                    e.preventDefault();
                }

                if (lastLi.hasClass('selected'))
                    lastLi.removeClass('selected');

                self.lastKey = e.which;
            });

            this.input.bind("paste", function (e) {
                if (self.options.blurOnPaste) {
                    var input = $(this);
                    self.timer = setTimeout(function () { input.blur(); }, 0);
                }
            });

            //setup blur handler
            this.input.blur(function (e) {
                if (self.input.val()) {
                    self._addTag(self.input.val(), self.input.data('value'));
                }
            });

            //define missing trim function for strings
            if (!String.prototype.trim) {
                String.prototype.trim = function () {
                    return this.replace(/^\s+|\s+$/g, '');
                };
            }

            if (this.options.select) {
                this.select = $('<select class="tagit-hiddenSelect" name="' +
                    (this.element.attr('name') || this.element.data('name')) +
                    '" multiple="multiple"></select>');
                this.element.after(this.select);
            }
            this._initialTags();

            //setup sortable handler
            if (self.options.sortable !== false) {

                var soptions = {
                    items:'.tagit-choice',
                    containment:'parent',
                    opacity: 0.6,
                    tolerance: 'pointer',
                    start:function (event, ui) {
                        self._sortable.tag = $(ui.item);
                        self._sortable.origIndex = self._sortable.tag.index();
                    },
                    update:function (event, ui) {
                        self._sortable.newIndex = self._sortable.tag.index();
                        self._moveTag(self._sortable.origIndex, self._sortable.newIndex);
                        if(self.options.tagsChanged){
                            var tag = self.tagsArray[self._sortable.newIndex];
                            self.options.tagsChanged(tag.value, 'moved', tag.element);
                        }
                    }
                };

                if (self.options.sortable == 'handle') {
                    soptions.handle = 'a.ui-icon';
                    soptions.cursor = 'move';
                }

                self.element.sortable(soptions);
            }

        },

        _popSelect:function (tag) {
            $('option:eq(' + tag.index + ')', this.select).remove();
            this.select.change();
        },

        _addSelect:function (tag) {
            var $optionEl = $('<option selected="selected" value="' + tag.valueUriEncoded() + '">' + tag.labelHtml() + '</option>');

            if (this.select.children().length > 0 && tag.index < this.select.children('option').length) {
                this.select.children('option')
                    .eq(tag.index)
                    .before($optionEl);
            }
            else {
                this.select.append($optionEl);
            }
            this.select.change();
        },

        _popTag:function (tag) {

            //are we removing the last tag or a specific tag?
            if (tag === undefined)
                tag = this.tagsArray.pop();
            else
                this.tagsArray.splice(tag.index, 1);


            //maintain the indexes
            for (var ind in this.tagsArray)
                this.tagsArray[ind].index = ind;

            if (this.options.select)
                this._popSelect(tag);
            if (this.options.tagsChanged)
                this.options.tagsChanged(tag.value || tag.label, 'popped', tag);
            return;
        },

        _addTag:function (label, value) {
            this.input.autocomplete('close').val("");

            //are we trying to add a tag that should be split?
            if (this._splitAt && label.search(this._splitAt) > 0) {
                var result = label.split(this._splitAt);
                for (var i = 0; i < result.length; i++)
                    this._addTag(result[i], value);
                return;
            }

            label = label.replace(/,+$/, "").trim();

            if (label == "")
                return false;

            var tag = this.tag(label, value);
            tag.element = $('<li class="tagit-choice"'
                + (value !== undefined ? ' tagValue="' + value + '"' : '') + '>'
                + (this.options.sortable == 'handle' ? '<a class="ui-icon ui-icon-grip-dotted-vertical" style="float:left"></a>' : '')
                + '<span class="tagit-text">' + tag.labelHtml() + '</span><a class="tagit-close">x</a></li>');

            var tagExists = this._exists(label, value);
            if (tagExists !== false && tagExists != this.input.parent().index()) {
                this._highlightExisting(tagExists);

                if (this.input.data().editing) {
                    tag.index = this.input.parents('.tagit-new').index();
                    this._handleDuplicateEditedTag(tag);
                }

                return false;
            }

            if (this.input.data().editing) {
                this._handleUpdateEditedTag(tag);
            }
            else {
                tag.element.insertBefore(this.input.parent());
                this.tagsArray.push(tag);
            }

            this.input.val("");

            if (this.options.select)
                this._addSelect(tag);
            if (this.options.tagsChanged)
                this.options.tagsChanged(tag.label, 'added', tag.element);

            this.input.data().editing = false;

            return true;
        },

        _exists:function (label, value) {
            if (this.tagsArray.length == 0)
                return false;

            label = this._lowerIfCaseInsensitive(label);
            value = this._lowerIfCaseInsensitive(value);

            for (var ind in this.tagsArray) {
                if (this._lowerIfCaseInsensitive(this.tagsArray[ind].label) == label) {
                    if (value !== undefined) {
                        if (this._lowerIfCaseInsensitive(this.tagsArray[ind].value) == value)
                            return ind;
                    } else {
                        return ind;
                    }
                }
            }

            return false;
        },

        _highlightExisting:function (index) {
            if (this.options.highlightOnExistColor === undefined)
                return;
            var tag = this.tagsArray[index];
            tag.element.stop();

            var initialColor = tag.element.css('color');
            tag.element.animate({color:this.options.highlightOnExistColor}, 100).animate({'color':initialColor}, 800);
        },

        _isInitKey:function (keyCode) {
            var keyName = "";
            for (var key in this._keys)
                if ($.inArray(keyCode, this._keys[key]) != -1)
                    keyName = key;

            if ($.inArray(keyName, this.options.triggerKeys) != -1)
                return true;
            return false;
        },

        _isTabKey:function (keyCode) {
            var tabKeys = this._keys['tab'];
            return $.inArray(keyCode, tabKeys) > -1;
        },

        _removeTag:function () {
            this._popTag();
            this.element.children(".tagit-choice:last").remove();
        },

        _backspace:function (li) {
            if (this.input.val() == "") {
                // When backspace is pressed, the last tag is deleted.
                if (this.lastKey == this._keys.backspace) {
                    this._popTag();
                    li.remove();
                    this.lastKey = null;
                } else {
                    li.addClass('selected');
                    this.lastKey = this._keys.backspace;
                }
            }
            return true;
        },

        _initialTags:function () {
            var input = this;
            var _temp;

            if (this.options.tagsChanged && !this.options.callbackOnInitialTagAdd) {
                _temp = this.options.tagsChanged;
                this.options.tagsChanged = null;
            }

            if (this.options.initialTags.length != 0) {
                $(this.options.initialTags).each(function (i, element) {
                    if (typeof (element) == "object")
                        input._addTag(element.label, element.value);
                    else
                        input._addTag(element);
                });
            }

            if (!this.options.callbackOnInitialTagAdd) {
                this.options.tagsChanged = _temp;
            }
        },

        _lowerIfCaseInsensitive:function (inp) {

            if (inp === undefined || typeof(inp) != typeof("a"))
                return inp;

            if (this.options.caseSensitive)
                return inp;

            return inp.toLowerCase();

        },

        _moveTag: function (old_index, new_index) {
            this.tagsArray.splice(new_index, 0, this.tagsArray.splice(old_index, 1)[0]);
            for (var ind in this.tagsArray)
                this.tagsArray[ind].index = ind;

            if(this.options.select){
                $('option:eq(' + old_index + ')', this.select).insertBefore($('option:eq(' + new_index + ')', this.select));
            }
        },
        tags:function () {
            return this.tagsArray;
        },

        destroy:function () {
            $.Widget.prototype.destroy.apply(this, arguments); // default destroy
            this.tagsArray = [];
        },

        reset:function () {
            this.element.find(".tagit-choice").remove();
            this.tagsArray = [];
            if (this.options.select) {
                this.select.children().remove();
                this.select.change();
            }
            this._initialTags();
            if (this.options.tagsChanged)
                this.options.tagsChanged(null, 'reset', null);
        },

        fill:function (tags) {

            if (tags !== undefined)
                this.options.initialTags = tags;
            this.reset();
        },

        add:function (label, value) {
            if(typeof(label) == "object")
                return this._addTag(label.label, label.value);
            else
                return this._addTag(label, value);
        },

        autocomplete: function(){
            return this.input.data("autocomplete");
        },

        tag:function (label, value, element) {
            var self = this;
            var encodeHtml = function (text) {
                return $('<div/>').text(text).html()
            };

            return {
                label:label,
                labelHtml: function() {
                    return encodeHtml(label)
                },
                value:(value === undefined ? label : value),
                valueUriEncoded: function() {
                    return encodeURIComponent(this.value);
                },
                element:element,
                index:self.tagsArray.length
            };
        },

        remove:function (label, value) {
            if (this.tagsArray.length == 0)
                return false;

            label = this._lowerIfCaseInsensitive(label);
            value = this._lowerIfCaseInsensitive(value);

            for (var i = 0; i < this.tagsArray.length; i++) {
                if (this._lowerIfCaseInsensitive(this.tagsArray[i].value) == value || this._lowerIfCaseInsensitive(this.tagsArray[i].label) == label) {
                    break;
                }
            }

            if (i >= 0 && i < this.tagsArray.length) {
                var tag = this.tagsArray[i];
                tag.element.remove();
                this._popTag(tag);
                return true;
            }
            return false;
        }


    });
})(jQuery);
