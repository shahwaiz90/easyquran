import sqlite3
import json
import os

layout_conn = sqlite3.connect('quran/assets/taj-indopak-16-lines.db')
script_conn = sqlite3.connect('quran/assets/indopak-nastaleeq.db')

layout_cursor = layout_conn.cursor()
script_cursor = script_conn.cursor()

# Get all words into a dictionary for ultra-fast lookup
script_cursor.execute("SELECT id, location, surah, ayah, text FROM words")
words_db = script_cursor.fetchall()

words_dict = {}
for w in words_db:
    # w is (id, location, surah, ayah, text)
    words_dict[w[0]] = {
        'l': w[1], # location (s:a:w)
        's': w[2],
        'a': w[3],
        't': w[4]
    }

# Get all pages
layout_cursor.execute("SELECT page_number, line_number, line_type, is_centered, first_word_id, last_word_id, surah_number FROM pages ORDER BY page_number ASC, line_number ASC")
pages_db = layout_cursor.fetchall()

mushaf_data = {}

for row in pages_db:
    page_num = row[0]
    line_num = row[1]
    line_type = row[2]
    is_centered = row[3]
    first_word_id = row[4]
    last_word_id = row[5]
    surah_number = row[6]
    
    if page_num not in mushaf_data:
        mushaf_data[page_num] = []
        
    line_obj = {
        'type': line_type,
        'center': bool(is_centered)
    }
    
    if line_type == 'surah_name':
        line_obj['surah'] = surah_number
    elif line_type == 'ayah':
        words_list = []
        # Tarteel DB is inclusive on both bounds (tested via SQL check)
        for wid in range(first_word_id, last_word_id + 1):
            if wid in words_dict:
                words_list.append(words_dict[wid])
        line_obj['words'] = words_list
        
    mushaf_data[page_num].append(line_obj)

# Write out to JS variable file so it can be loaded directly without async fetch if preferred
out_path = 'quran/js/tarteel-taj-data.js'
with open(out_path, 'w', encoding='utf-8') as f:
    f.write("const TARTEEL_TAJ_DATA = ")
    json.dump(mushaf_data, f, ensure_ascii=False, separators=(',', ':'))
    f.write(";\n")

print(f"Successfully generated {out_path} with {len(mushaf_data)} pages.")
