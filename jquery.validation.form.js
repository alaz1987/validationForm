/* 
 *  Oneway Studio. Copyright 2008-2014.
 *  All rights reserved.
 * 
 *  @author alex
 *  Jan 22, 2014
 *  
 *  jquery.validation.form.js (windows-1251)
 *  Validation form Plugin (test in jquery 1.8.3)
 *  
 *  @uses
 *      $(form).validationForm(options);
 *      options = {
 *          dataItemValidationRule  : 'validation-rule',            // data-������� ��� ������ ��������� ��������� ����� (��������� ��������: required, equal[id], min-lengh[n], type[text, email, phone, date, number])
 *          dataItemErrorMessage    : 'error',                      // data-������� ��� ������������ ��������� �� ������� �� ��������� ����� 
 *          dataItemPlaceholder     : 'placeholder',                // data-������� ��� ���������*
 *
 *          itemErrorClass          : 'form_item_ERROR',            // ����� ��� ��������� ������������� �������� ����� (���� �� �� ��������)
 *          errorTooltipClass       : 'def_form_message_ERROR',     // ����� ��� ���������� � tooltip-�������
 *          errorTooltipTextClass   : 'dfmE_text',                  // ����� ��� ������ ���������� � tooltip-�������
 *
 *          useAjax                 : false,                        // ����, ������������, ����� �� ����� ��������� ��������� ��� ���.
 *                                                                   // ���� false, �� ������ � ����� ����� ���������� ���������, �� �������� �� ����. ��������� ������� onAfterSuccessValidate ��� ���
 *
 *          callbacks               : {                             // �������, ������������ ��� ��������� �����
 *               onSubmitForm             : function(form) {},
 *               onBeforeValidate         : function(element) {},         
 *               onAfterValidate          : function(element, dataResult) {},          
 *               onAfterSuccessValidate   : function(form) {},         
 *               onAfterErrorValidate     : function(form) {}          
 *          }
 *      }
 */

// ������� ��������
$.fn.blinkEffect = function(opt) {

	var obj = $(this);

	var options = $.extend({
            speed : 300,
            count : 2
        }, opt);

	var timer = setInterval(function() {
            options.count--;
            obj.fadeOut(options.speed/2, function() {
                obj.fadeIn(options.speed/2);
            });

            if (options.count == 0)
		clearInterval(timer);
	}, options.speed);
}; 
 
(function($) {
    var methods = {
        init : function(opt) {
            /* ��������� */
            var options = $.extend(true, {
                    dataItemValidationRule  : 'validation-rule',            // data-������� ��� ������ ��������� ��������� ����� (��������� ��������: required, equal[id], min-lengh[n], type[text, email, phone, date, number])
                    dataItemErrorMessage    : 'error',                      // data-������� ��� ������������ ��������� �� ������� �� ��������� ����� 
                    dataItemPlaceholder     : 'placeholder',                // data-������� ��� ���������
                    
                    itemErrorClass          : 'form_item_ERROR',            // ����� ��� ��������� ������������� �������� ����� (���� �� �� ��������)
                    errorTooltipClass       : 'def_form_message_ERROR',     // ����� ��� ���������� � tooltip-�������
                    errorTooltipTextClass   : 'dfmE_text',                  // ����� ��� ������ ���������� � tooltip-�������
                    
                    useAjax                 : false,                        // ����, ������������, ����� �� ����� ��������� ��������� ��� ���.
                                                                            // ���� false, �� ������ � ����� ����� ���������� ���������, �� �������� �� ����. ��������� ������� onAfterSuccessValidate ��� ���
                    
                    callbacks               : {                             // �������, ������������ ��� ��������� �����
                        onSubmitForm             : function(form) {},
                        onBeforeValidate         : function(element) {},         
                        onAfterValidate          : function(element, dataResult) {},          
                        onAfterSuccessValidate   : function(form) {},         
                        onAfterErrorValidate     : function(form) {}          
                    }
            }, opt);
            
            var $form = this;
            var $items = $form.find('[data-' + options.dataItemValidationRule + ']');
            var lastErrorBlock = null;
            
            // onScreen jQuery plugin v0.2.1
            // @link http://benpickles.github.io/onScreen/jquery.onscreen.js
            $.expr[":"].onScreen = function(elem) {
                var $window = $(window);
                var viewport_top = $window.scrollTop();
                var viewport_height = $window.height();
                var viewport_bottom = viewport_top + viewport_height;
                var $elem = $(elem);
                var top = $elem.offset().top;
                var height = $elem.height();
                var bottom = top + height;

                return (top >= viewport_top && top < viewport_bottom) ||
                       (bottom > viewport_top && bottom <= viewport_bottom) ||
                       (height > viewport_height && top <= viewport_top && bottom >= viewport_bottom)
            }
            
            // ����� ������
            var showError = function($this, errorMsg) {
                $this.parent().find('.'+options.errorTooltipTextClass).html(errorMsg);
                $this.addClass(options.itemErrorClass);
                var error = $this.parent().find('.'+options.errorTooltipClass).show(200);
                lastErrorBlock = error;
            }
            var hideError = function($this) {
                $this.removeClass(options.itemErrorClass);
                $this.parent().find('.'+options.errorTooltipClass).hide(200);
            }
            
            // ������� ��������� �� ���� type[text, email, phone, date, number]
            // ���� ���������� ����� ��������� type, �� ������� ���� ����� ��������
            var methodTypes = {
                text : function(text) {
                    return true;
                },
                email : function(email) {
                    return (/^\w+[a-zA-Z0-9_.-]*@{1}\w{1}[a-zA-Z0-9_.-]*\.{1}\w{2,4}$/.test(email));
                },
                phone : function(phone) {
                    return (
                        /^\+{0,1}\d{1}(\s|-){0,1}\d{3}(\s|-){0,1}\d{3}(\s|-){0,1}\d{2}(\s|-){0,1}\d{2}$/.test(phone) // mobile phone +X-XXX-XXX-XX-XX | X XXX XXX XX XX | XXXXXXXXXXX
                        ||
                        /^\d{2}(\s|-){0,1}\d{2}(\s|-){0,1}\d{2}$/   // work phone XX-XX-XX | XX XX XX | XXXXXX
                        .test(phone)
                    );
                },
                date : function(date) {
                    return /\d{1,2}\.\d{1,2}\.\d{4}/.test(date);    // dd.mm.yyyy
                },
                number : function() {
                    return !isNaN(parseFloat(n)) && isFinite(n);
                }
            }
            
            // ������� ��������� �� �������� rules [type, required, equal, min-length]
            // ���� ���������� ����� ��������� �������, �� ������� ���� ����� ��������
            var methodRules = {
                'type' : function(type, value) {
                    return methodTypes[type](value);
                },
                'required' : function(isRequred, value, emptyValue) {
                    if (isRequred)
                        return !(value === '' || value === emptyValue);
                    else
                        return true;
                },
                'equal' : function(id, value) {
                    return (value === $('#'+id).val());
                },
                'min-length' : function(minLength, value) {
                    return (value.length >= minLength);
                }
            }
            
            // ������� �������� ���������� �������� �� �������� validateRule
            // ���� ���������� ������ ���������� ����: { type[text, email, phone, date, number], required[true, false], equal[id], min-length[count] }
            var validate = function($this, validateRule, checkEmptyField) {
                var thisValue = $this.attr('value');
                var thisPlaceholder = $this.data(options.dataItemPlaceholder);
                var validResult = true;
                var errMsg = null;
                
                options.callbacks.onBeforeValidate($this);
                
                for (var rule in validateRule)
                {
                    var ruleValue = validateRule[rule];
                    var curValidResult = methodRules[rule](ruleValue, thisValue, thisPlaceholder);
                    
                    if (!curValidResult)
                        errMsg = $this.data(options.dataItemErrorMessage + '-' + rule);
                        
                    validResult = curValidResult && validResult;
                }
                
                if (validResult || !checkEmptyField) {
                    hideError($this);
                } else {
                    showError($this, errMsg);
                }
                options.callbacks.onAfterValidate($this, { result : validResult });
                
                return validResult;
            };
            
            // ������� ��� ��������� ����� �����
            var formValidate = function($elements) {
                var validResult = true;
                
                $elements.each(function() {
                    var $item = $(this);
                    var validateRule = $item.data(options.dataItemValidationRule);
                    
                    if (typeof validateRule == 'object' && !$.isEmptyObject(validateRule)) {
                        var curValidResult = validate($item, validateRule, true);
                        validResult = validResult && curValidResult;
                        
                        if (!curValidResult)
                            $('.'+options.errorTooltipTextClass, $item.parent()).blinkEffect(); // ������� ��������
                    }
                });
                
                return validResult;
            };
            
            // ������� ��������� �������� �� ��������� ������
            // (��������� ��� ������� ����, ����� ����� ������ ��������� �� �������)
            var scrollToTop = function() {
                var onScreen = lastErrorBlock.not(':onScreen').length > 0;
                if (onScreen) {
                    var offset  = parseInt(lastErrorBlock.offset().top) - parseInt($(window).height()) / 2;
                    $('html, body').animate({scrollTop: offset}, 500);
                }
            }
            
            // ������� ��� ����� ����
            $items.each(function() {
                var $item = $(this);
                var validateRule = $item.data(options.dataItemValidationRule);

                if (typeof validateRule == 'object' && !$.isEmptyObject(validateRule)) {
                    // focusin event
                    $item.bind('focusin.validationForm', function() {
                        $item.val($item.val().trim());
                        validate($item, validateRule, false);
                    })
                    // focusout event
                    .bind('focusout.validationForm', function() {
                        $item.val($item.val().trim());
                        validate($item, validateRule, true);
                            
                    });
                }
            });
            
            // submit form event
            $form.bind('submit.validationForm', function() {
                options.callbacks.onSubmitForm($(this));
                var validResult = formValidate($items);

                if (validResult)
                    options.callbacks.onAfterSuccessValidate($(this));
                else {
                    options.callbacks.onAfterErrorValidate($(this));
                    scrollToTop();
                }
                
                return (!options.useAjax && validResult);
            });

            return $form;
        }
    };
    
    $.fn.validationForm = function(method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error( '����� � ������ ' +  method + ' �� ���������� ��� jQuery.validationForm');
        }   
    };
})(jQuery);

