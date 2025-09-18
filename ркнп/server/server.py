from flask import Flask, jsonify
from flask_cors import CORS
import serial
import serial.tools.list_ports
import threading
import time

app = Flask(__name__)
CORS(app)  # ✅ разрешаем запросы с фронта

# Храним последние данные
latest = {"workers": []}

# Пытаемся найти Arduino
def connect_serial():
    try:
        ports = serial.tools.list_ports.comports()
        for port in ports:
            if "Arduino" in port.description or "USB-SERIAL" in port.description:
                print(f"✅ Нашёл Arduino на {port.device}")
                return serial.Serial(port.device, 9600, timeout=1)
        print("⚠️ Arduino не найдено")
        return None
    except Exception as e:
        print("⚠️ Ошибка при поиске Arduino:", e)
        return None

ser = connect_serial()

def read_serial():
    global latest
    while True:
        if ser and ser.is_open:
            try:
                line = ser.readline().decode(errors="ignore").strip()
                if not line:
                    continue
                # Ожидаем формат: id,h2s,hours,lat,lng
                parts = line.split(',')
                if len(parts) != 5:
                    continue
                worker = {
                    "id": parts [0],
                    "h2s": float(parts[1]),
                    "hours": float(parts[2]),
                    "lat": float(parts[3]),
                    "lng": float(parts[4])
                }
                
                # Обновляем по id
                updated = False
                for i, w in enumerate(latest["workers"]):
                    if w["id"] == worker["id"]:
                        latest["workers"][i] = worker
                        updated = True
                        break
                if not updated:
                    latest["workers"].append(worker)
            except Exception as e:
                print("⚠️ Serial read error:", e)
        time.sleep(0.1)

@app.route("/")
def home():
    return "✅ Flask сервер работает! Данные смотри на /api/data"

@app.route("/api/data")
def get_data():
    return jsonify(latest)

if __name__ == '__main__':
    thread = threading.Thread(target=read_serial, daemon=True)
    thread.start()
    app.run(host="0.0.0.0", port=5000)
