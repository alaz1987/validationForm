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
 *          dataItemValidationRule  : 'validation-rule',            // data-атрибут для правил валидации элементов формы (возможные значение: required, equal[id], min-lengh[n], type[text, email, phone, date, number])
 *          dataItemErrorMessage    : 'error',                      // data-атрибут для выдергивания сообщений об ошибках из элементов формы 
 *          dataItemPlaceholder     : 'placeholder',                // data-атрибут для подсказки*
 *
 *          itemErrorClass          : 'form_item_ERROR',            // класс для выделения валидируемого элемента формы (если он не валидный)
 *          errorTooltipClass       : 'def_form_message_ERROR',     // класс для контейнера с tooltip-ошибкой
 *          errorTooltipTextClass   : 'dfmE_text',                  // класс для текста контейнера с tooltip-ошибкой
 *
 *          useAjax                 : false,                        // флаг, определяющий, нужно ли форму сабмитить браузером или нет.
 *                                                                   // Если false, то данные с формы будут отсылаться браузером, не зависимо от того. сработала функция onAfterSuccessValidate или нет
 *
 *          callbacks               : {                             // функции, вызывающиеся при валидации формы
 *               onSubmitForm             : function(form) {},
 *               onBeforeValidate         : function(element) {},         
 *               onAfterValidate          : function(element, dataResult) {},          
 *               onAfterSuccessValidate   : function(form) {},         
 *               onAfterErrorValidate     : function(form) {}          
 *          }
 *      }
 */

// Мигание элемента
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
            /* Настройки */
            var options = $.extend(true, {
                    dataItemValidationRule  : 'validation-rule',            // data-атрибут для правил валидации элементов формы (возможные значение: required, equal[id], min-lengh[n], type[text, email, phone, date, number])
                    dataItemErrorMessage    : 'error',                      // data-атрибут для выдергивания сообщений об ошибках из элементов формы 
                    dataItemPlaceholder     : 'placeholder',                // data-атрибут для подсказки
                    
                    itemErrorClass          : 'form_item_ERROR',            // класс для выделения валидируемого элемента формы (если он не валидный)
                    errorTooltipClass       : 'def_form_message_ERROR',     // класс для контейнера с tooltip-ошибкой
                    errorTooltipTextClass   : 'dfmE_text',                  // класс для текста контейнера с tooltip-ошибкой
                    
                    useAjax                 : false,                        // флаг, определяющий, нужно ли форму сабмитить браузером или нет.
                                                                            // Если false, то данные с формы будут отсылаться браузером, не зависимо от того. сработала функция onAfterSuccessValidate или нет
                    
                    callbacks               : {                             // функции, вызывающиеся при валидации формы
                        onSubmitForm             : function(form) {},
                        onBeforeValidate         : function(element) {},         
                        onAfterValidate          : function(element, dataResult) {},          
                        onAfterSuccessValidate   : function(form) {},         
                        onAfterErrorValidate     : function(form) {}          
                    }
            }, opt);
            
            var $form = this;
            $form.$items = $form.find('[data-' + options.dataItemValidationRule + ']');
            var lastErrorBlock = null;
            $form.isValid = true;
            
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
            
            // Вывод ошибок
            var showError = function($this, errorMsg) {
                $this.parent().find('.'+options.errorTooltipTextClass).html(errorMsg);
                $this.addClass(options.itemErrorClass);
                $this.parent().find('.'+options.errorTooltipClass).show(200);
                lastErrorBlock = $form.find('.'+options.errorTooltipClass+':visible').first();
            }
            var hideError = function($this) {
                $this.removeClass(options.itemEOrrorClass);
                $this.parent().find('.'+options.errorTooltipClass).hide(200);
            }
            
            // Функции валидации по типу type[text, email, phone, date, number]
            // Если необходимо будет расширить type, то добавим сюда новое свойство
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
            
            // Функции валидации по правилам rules [type, required, equal, min-length]
            // Если необходимо будет расширить правила, то добавим сюда новое свойство
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
            
            // Функция проверки валидности элемента по правилам validateRule
            // Сюда передается объект следующего вида: { type[text, email, phone, date, number], required[true, false], equal[id], min-length[count] }
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
            
            // Функция прокрутки страницы до последней ошибки
            // (актуально для больших форм, когда текст ошибки находится за экраном)
            var scrollToTop = function() {
                var onScreen = lastErrorBlock.not(':onScreen').length > 0;
                if (onScreen) {
                    var offset  = parseInt(lastErrorBlock.offset().top) - parseInt($(window).height()) / 2;
                    $('html, body').animate({scrollTop: offset}, 500);
                }
            }
            
            // Функция для валидации полей формы
            $form.formValidate = function($elements) {
                var validResult = true;
                
                $elements.each(function() {
                    var $item = $(this);
                    var validateRule = $item.data(options.dataItemValidationRule);
                    
                    if (typeof validateRule == 'object' && !$.isEmptyObject(validateRule)) {
                        var curValidResult = validate($item, validateRule, true);
                        validResult = validResult && curValidResult;
                        
                        if (!curValidResult)
                            $('.'+options.errorTooltipTextClass, $item.parent()).blinkEffect(); // Мигание элемента
                    }
                });
                
                if (!validResult) scrollToTop();
                
                return validResult;
            };
            
            // События для полей форм
            $form.$items.each(function() {
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
                var validResult = $form.formValidate($form.$items);
                $form.isValid = validResult;
                
                if (validResult)
                    options.callbacks.onAfterSuccessValidate($(this));
                else {
                    options.callbacks.onAfterErrorValidate($(this));
                }
                
                return (!options.useAjax && validResult);
            });

            return $form;
        },
        validate : function() {
            this.isValid = this.formValidate(this.$items);
            return this.isValid;
        }
    };
    
    $.fn.validationForm = function(method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error( 'Метод с именем ' +  method + ' не существует для jQuery.validationForm');
        }   
    };
})(jQuery);

