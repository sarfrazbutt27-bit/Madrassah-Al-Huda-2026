
-- Seed Content for Lesson 1 (Huruf Mufradat)
INSERT INTO qaida_content (lesson_id, arabic_text, transliteration, audio_url, sort_order)
SELECT 
    id, 'ا', 'Alif', 'https://www.islamcan.com/audio/qaida/1.mp3', 1
FROM qaida_lessons WHERE lesson_number = 1;

INSERT INTO qaida_content (lesson_id, arabic_text, transliteration, audio_url, sort_order)
SELECT 
    id, 'ب', 'Ba', 'https://www.islamcan.com/audio/qaida/2.mp3', 2
FROM qaida_lessons WHERE lesson_number = 1;

INSERT INTO qaida_content (lesson_id, arabic_text, transliteration, audio_url, sort_order)
SELECT 
    id, 'ت', 'Ta', 'https://www.islamcan.com/audio/qaida/3.mp3', 3
FROM qaida_lessons WHERE lesson_number = 1;

INSERT INTO qaida_content (lesson_id, arabic_text, transliteration, audio_url, sort_order)
SELECT 
    id, 'ج', 'Jeem', 'https://www.islamcan.com/audio/qaida/5.mp3', 5
FROM qaida_lessons WHERE lesson_number = 1;

INSERT INTO qaida_content (lesson_id, arabic_text, transliteration, audio_url, sort_order)
SELECT 
    id, 'ح', 'Ha', 'https://www.islamcan.com/audio/qaida/6.mp3', 6
FROM qaida_lessons WHERE lesson_number = 1;

INSERT INTO qaida_content (lesson_id, arabic_text, transliteration, audio_url, sort_order)
SELECT 
    id, 'خ', 'Kha', 'https://www.islamcan.com/audio/qaida/7.mp3', 7
FROM qaida_lessons WHERE lesson_number = 1;

INSERT INTO qaida_content (lesson_id, arabic_text, transliteration, audio_url, sort_order)
SELECT 
    id, 'د', 'Dal', 'https://www.islamcan.com/audio/qaida/8.mp3', 8
FROM qaida_lessons WHERE lesson_number = 1;

-- Seed some Tajweed examples for later lessons
INSERT INTO qaida_content (lesson_id, arabic_text, transliteration, tajweed_rule, explanation, sort_order)
SELECT 
    id, 'مَنْ يَقُولُ', 'Man yaqulu', 'noon_sakinah', 'Idgham with Ghunnah: When Noon Sakinah is followed by Ya, merge the sound with a nasal buzz.', 1
FROM qaida_lessons WHERE lesson_number = 8;

INSERT INTO qaida_content (lesson_id, arabic_text, transliteration, tajweed_rule, explanation, sort_order)
SELECT 
    id, 'قُلْ هُوَ', 'Qul huwa', 'qalqalah', 'Qalqalah: The letter Qaf is a bouncing letter when it has a Sukoon.', 2
FROM qaida_lessons WHERE lesson_number = 5;
