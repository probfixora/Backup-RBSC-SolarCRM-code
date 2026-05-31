import base64
with open(r'C:/Users/Nikhil/.gemini/antigravity/brain/f8a6c5be-e98f-42e9-ac2f-d5e52e9d9b02/media__1779177644857.png', 'rb') as f:
    b64 = base64.b64encode(f.read()).decode('utf-8')
with open('supabase/functions/quotation/qrBase64.ts', 'w', encoding='utf-8') as out:
    out.write(f'export const qrBase64 = "{b64}";\n')
print('Done!')
