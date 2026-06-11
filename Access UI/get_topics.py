import json

file_path = r'c:\Users\klara\Documents\Nepelemes ügyek\Széphő\OCPP\Szepho EV Charger teljes vezérlés 260302.json'
with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

topics = set()
for node in data:
    if node.get('type') == 'mqtt out':
        if 'topic' in node:
            topics.add(node['topic'])

print("MQTT Out topics:")
for t in topics:
    print(t)
