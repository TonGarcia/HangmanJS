window.bd = null;

function blink(element) {
    element.removeClass('new');
    setTimeout(function() {
        element.addClass('new');
        setTimeout(function() {
            element.removeClass('new');
        }, 1000);
    }, 1);
}

$(function () {

    /**
     * HangmanJS - Andrew Hathaway - Updated by Ilton Garcia dos Santos Silveira
     *
     * @todo: Replace "current_body_part" with "fail_score"
     * @todo: Refactor body_parts. Legs/arms should use same function
     * @todo: Consider moving words to private place
     *
     */
    var HangmanJS;
    HangmanJS = function () {

        /**
         * Make sure that we're a constructor and not a function call
         */
        if ((!this instanceof HangmanJS)) {
            return new HangmanJS();
        }

        /**
         * Default words to pick from
         */
        HangmanJS.game_words = [
            'technology',
            'fantastic',
            'buckaroo',
            'bandwagon',
            'icebox',
            'jawbreaker',
            'zombie',
            'cheese',
            'because',
            'football',
            'jazz',
            'exponential',
            'atlantis',
            'psychologist',
            'archaeologist',
            'quarantine',
            'champion',
            'protestant'
        ];

        /**
         * Array of used characters
         */
        HangmanJS.used_characters = [];

        /**
         * The current word
         */
        HangmanJS.current_word = {};

        /**
         * The death score
         */
        HangmanJS.fail_score = 0;

        /**
         * The score at which the player fails
         */
        HangmanJS.failed_score = 8;

        /**
         * Count of correct chars guessed
         */
        HangmanJS.correctly_guessed = 0;

        /**
         * The Character canvas
         */
        HangmanJS.canvas = null;

        /**
         * Canvas Context
         */
        HangmanJS.character_ctx = null;

        /**
         * Current body part count
         */
        HangmanJS.current_body_part = 0;

        /**
         * Maps part id's to functions
         */
        HangmanJS.body_parts = [
            'frame',
            'noose',
            'head',
            'body',
            'left_arm',
            'right_arm',
            'left_leg',
            'right_leg'
        ];

        /**
         * Initiate HangmanJS
         */
        this.init = function () {
            HangmanJS.bind_menu();

            if (document.location.href.indexOf('#game') > -1) {
                HangmanJS.setup_game();
            }

            if (document.location.href.indexOf('#credits') > -1) {
                HangmanJS.view_credits();
            }

            // FOR LIDIA`S VERSION PERFORM "GO TO GAME" WITHOUT ANY BUTTON CLICK (SKIPPING START SCREEN)
            HangmanJS.setup_game();
            window.HangmanJS = HangmanJS;
        };

        /**
         * Bind menu buttons
         */
        HangmanJS.bind_menu = function () {
            var play_button = $('#play-game');
            var credits_button = $('#view-credits');

            play_button.click(function (e) {
                e.preventDefault();
                HangmanJS.setup_game();
            });

            credits_button.click(function (e) {
                e.preventDefault();
                HangmanJS.view_credits();
            });
        };

        /**
         * View the credits page
         */
        HangmanJS.view_credits = function () {
            $('#credits').addClass('show');
            HangmanJS.bind_close();
        };

        /**
         * Setup the game
         */
        HangmanJS.setup_game = function () {
            HangmanJS.open_game();
            HangmanJS.bind_close();

            HangmanJS.current_word = HangmanJS.pick_word();

            HangmanJS.setup_characters();
            HangmanJS.setup_info();

            HangmanJS.setup_hints();
            HangmanJS.setup_canvas();

            HangmanJS.bind_enter_character();
            HangmanJS.setup_alphabet();
        };

        /**
         * Open the game window
         */
        HangmanJS.open_game = function () {
            var stage = $('#game-stage');
            stage.addClass('show');
        };

        /**
         * Close button bindings
         */
        HangmanJS.bind_close = function () {
            $('.js-to-menu').click(function (e) {
                e.preventDefault();
                // HangmanJS.to_menu($(this).data('from'));
                HangmanJS.reload_saving_progress();
            });
        };

        /**
         * Rebuild the Hangman screen
         * saving it progress
         * (not scoring, but it could be done doing this way)
         */
        HangmanJS.reload_saving_progress = function() {

        };

        HangmanJS.remove_right_word = function() {
            var current_word_i;
            for(w in HangmanJS.game_words)
                if(HangmanJS.current_word === HangmanJS.game_words[w].name)
                    current_word_i = w;

            const once_deletion = 1;
            HangmanJS.game_words.splice(current_word_i, once_deletion);
        };

        /**
         * Go to the menu
         */
        HangmanJS.to_menu = function (from) {
            $('.game-section.' + from).removeClass('show');

            if (from === 'game') {
                HangmanJS.revert_game();
            }
        };

        /**
         * Retrieve Professionals from BD JSON
         * it is not an async ajax, so the JS wait it complete to continue
         */
        HangmanJS.setup_from_json_bd = function () {
            // OBS: no need to save on localStorage, it game doesn't refresh it page
            if(window.bd) return;

            $.ajax({
                url: "bd/adolescentro-profissionais.json",
                type: 'GET',
                async: false,
                cache: false,
                timeout: 3000,
                error: function(e){
                    console.log(e);
                    alert('Ooops! Something went wrong...');

                    return true;
                },
                success: function(resp) {
                    window.bd = resp;
                }
            });
        };

        /**
         * Pick a random word/professional
         */
        HangmanJS.pick_word = function () {
            var chars;
            var uppercase_chars = [];
            HangmanJS.setup_from_json_bd();
            HangmanJS.game_words = window.bd;
            var item = HangmanJS.game_words[Math.floor(Math.random() * HangmanJS.game_words.length)];

            console.log(item);
            chars = item.name.split('');
            for (var i = 0; i < chars.length; i++) {
                uppercase_chars.push(chars[i].toUpperCase());
            }

            return {
                word: item.name,
                length: item.name.replace(' ', '').length,
                hints: item.hints,
                chars: uppercase_chars
            };
        };

        /**
         * Setup the list of the alphabet
         */
        HangmanJS.setup_alphabet = function () {
            var list = $('#alphabet');
            var alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

            for (var i = 0; i < alphabet.length; i++) {
                var next_char = alphabet.charAt(i);
                list.append('<li data-char="' + next_char + '">' + next_char + '</li>');
            }
        };

        /**
         * Bind the event handler for character enter
         */
        HangmanJS.bind_enter_character = function () {
            var input = $('#enter-char-input');

            input.keypress(function (e) {
                if (e.which === 13) {
                    var c = input.val();

                    if (c !== '' && c.match(/^[a-zA-Z]+$/)) {
                        HangmanJS.input_char(c);
                    }

                    input.val('');
                }
            });
        };

        /**
         * Character delegate
         */
        HangmanJS.input_char = function (character) {
            character = character.toUpperCase();

            if ($.inArray(character, HangmanJS.used_characters) === -1) {
                HangmanJS.used_characters.push(character);

                $('#alphabet li[data-char=' + character + ']').addClass('used');

                if ($.inArray(character, HangmanJS.current_word.chars) > -1) {

                    $('#alphabet li[data-char=' + character + ']').addClass('in-word');

                    for (var i = 0; i < HangmanJS.current_word.chars.length; i++) {

                        if (HangmanJS.current_word.chars[i] === character) {
                            HangmanJS.correctly_guessed++;
                            $('.word-characters li[data-id="' + i + '"]').html(character);
                        }

                    }

                    if (HangmanJS.correctly_guessed >= HangmanJS.current_word.length) {
                        $('input').blur();
                        $('#overlay').addClass('show');
                        $('#overlay .modal.success').addClass('show');
                        HangmanJS.remove_right_word();
                    }

                } else {
                    HangmanJS.fail_score++;

                    HangmanJS.add_body_part();
                    HangmanJS.update_score();
                    HangmanJS.add_new_hint();

                    if (HangmanJS.fail_score >= HangmanJS.failed_score) {
                        $('input').blur();
                        $('#overlay').addClass('show');
                        $('#overlay .modal.failed').addClass('show');
                    }
                }
            }
        };

        /**
         * Setup the allowed characters list
         */
        HangmanJS.setup_characters = function () {
            var list = $('.word-characters');

            for (var i = 0; i < HangmanJS.current_word.chars.length; i++) {
                list.append('<li data-id="' + i + '"></li>');
            }
        };

        /**
         * Setup the game information
         */
        HangmanJS.setup_info = function () {
            $('.word-length').html(HangmanJS.current_word.length);

            HangmanJS.update_score();
        };

        /**
         * Update the game score view
         */
        HangmanJS.update_score = function () {
            var holder = $('.attempts-left');

            holder.html(HangmanJS.failed_score - HangmanJS.fail_score);
        };

        /**
         * Setup the game canvas
         */
        HangmanJS.setup_canvas = function () {
            HangmanJS.character = $('#character');
            HangmanJS.character = HangmanJS.character[0];

            HangmanJS.character_ctx = HangmanJS.character.getContext('2d');
        };

        /**
         * Setup the hints box
         */
        HangmanJS.setup_hints = function () {
            HangmanJS.hints_list_element = document.getElementById('hints');
            HangmanJS.current_hint_item = 0;
            HangmanJS.hints_itens_elements = [];

            for(h in HangmanJS.current_word.hints)
                HangmanJS.hints_itens_elements.push("<li><p id='hint_"+h+"'>"+ HangmanJS.current_word.hints[h] +"</p></li>");

            HangmanJS.add_new_hint();
        };

        /**
         * Add a new hint to the hints list, based on HangmanJS.current_hint_item
         */
        HangmanJS.add_new_hint = function() {
            var new_hint = HangmanJS.hints_itens_elements[HangmanJS.current_hint_item];
            if(!new_hint) return;

            HangmanJS.new_hint = new_hint;
            HangmanJS.hints_list_element.innerHTML = HangmanJS.new_hint + HangmanJS.hints_list_element.innerHTML;
            blink($('#hint_'+HangmanJS.current_hint_item));

            HangmanJS.current_hint_item++;
        };

        /**
         * Adds another body part to the canvas
         */
        HangmanJS.add_body_part = function () {
            var part;

            if (HangmanJS.current_body_part < HangmanJS.body_parts.length) {
                part = HangmanJS.body_parts[HangmanJS.current_body_part];

                HangmanJS.character_parts[part]();
                HangmanJS.current_body_part++;
            }

        };

        /**
         * Character parts - Canvas
         *
         * 1) Frame
         * 2) Noose
         * 3) Head
         * 4) Body
         * 5) Left Arm
         * 6) Right Arm
         * 7) Left Lef
         * 8) Right Leg
         *
         * Needs work...just looks ugly.
         */
        HangmanJS.character_parts = {

            frame: function () {

                HangmanJS.character_ctx.beginPath();
                HangmanJS.character_ctx.moveTo(0, 399);
                HangmanJS.character_ctx.lineTo(300, 399);
                HangmanJS.character_ctx.lineWidth = 2;
                HangmanJS.character_ctx.strokeStyle = '#ffffff';
                HangmanJS.character_ctx.stroke();

                HangmanJS.character_ctx.beginPath();
                HangmanJS.character_ctx.moveTo(40, 5);
                HangmanJS.character_ctx.lineTo(40, 400);
                HangmanJS.character_ctx.lineWidth = 2;
                HangmanJS.character_ctx.strokeStyle = '#ffffff';
                HangmanJS.character_ctx.stroke();

            },

            noose: function () {

                HangmanJS.character_ctx.beginPath();
                HangmanJS.character_ctx.moveTo(40, 5);
                HangmanJS.character_ctx.lineTo(HangmanJS.character.width / 2, 5);
                HangmanJS.character_ctx.lineWidth = 2;
                HangmanJS.character_ctx.strokeStyle = '#ffffff';
                HangmanJS.character_ctx.stroke();

                HangmanJS.character_ctx.beginPath();
                HangmanJS.character_ctx.moveTo(HangmanJS.character.width / 2, 5);
                HangmanJS.character_ctx.lineTo(HangmanJS.character.width / 2, 30);
                HangmanJS.character_ctx.lineWidth = 2;
                HangmanJS.character_ctx.strokeStyle = '#ffffff';
                HangmanJS.character_ctx.stroke();

            },

            head: function () {

                HangmanJS.character_ctx.beginPath();
                HangmanJS.character_ctx.arc(HangmanJS.character.width / 2, 65, 35, 0, 2 * Math.PI, false);
                HangmanJS.character_ctx.lineWidth = 2;
                HangmanJS.character_ctx.strokeStyle = '#ffffff';
                HangmanJS.character_ctx.stroke();

            },

            body: function () {

                HangmanJS.character_ctx.beginPath();
                HangmanJS.character_ctx.moveTo(HangmanJS.character.width / 2, 100);
                HangmanJS.character_ctx.lineTo(HangmanJS.character.width / 2, 250);
                HangmanJS.character_ctx.lineWidth = 2;
                HangmanJS.character_ctx.strokeStyle = '#ffffff';
                HangmanJS.character_ctx.stroke();

            },

            arm: function (side) {
                side = side || 'left';

                var start_x = (HangmanJS.character.width / 2) - 50;

                if (side == 'right') {
                    start_x = (HangmanJS.character.width / 2) + 50;
                }

                HangmanJS.character_ctx.beginPath();
                HangmanJS.character_ctx.moveTo(HangmanJS.character.width / 2, 150);
                HangmanJS.character_ctx.lineTo(start_x, 180);
                HangmanJS.character_ctx.lineWidth = 2;
                HangmanJS.character_ctx.strokeStyle = '#ffffff';
                HangmanJS.character_ctx.stroke();
            },

            leg: function (side) {
                side = side || 'left';

                var start_x = (HangmanJS.character.width / 2) - 50;

                if (side == 'right') {
                    start_x = (HangmanJS.character.width / 2) + 50;
                }

                HangmanJS.character_ctx.beginPath();
                HangmanJS.character_ctx.moveTo(HangmanJS.character.width / 2, 250);
                HangmanJS.character_ctx.lineTo(start_x, 350);
                HangmanJS.character_ctx.lineWidth = 2;
                HangmanJS.character_ctx.strokeStyle = '#ffffff';
                HangmanJS.character_ctx.stroke();
            },

            left_arm: function () {
                this.arm('left');
            },

            right_arm: function () {
                this.arm('right');
            },

            left_leg: function () {
                this.leg('left');
            },

            right_leg: function () {
                this.leg('right');
            }

        };

        /**
         * Reverts the game
         */
        HangmanJS.revert_game = function () {
            $('#alphabet').empty();
            HangmanJS.used_characters = [];

            HangmanJS.fail_score = 0;
            HangmanJS.correctly_guessed = 0;

            HangmanJS.character.width = HangmanJS.character.width;
            HangmanJS.current_body_part = 0;

            $('.word-characters').html('');

            $('#overlay').removeClass('show');
            $('#overlay .modal.failed').removeClass('show');
            $('#overlay .modal.succuess').removeClass('show');
        };

    };

    //Move this shit
    var hangman = new HangmanJS();
    hangman.init();

});
