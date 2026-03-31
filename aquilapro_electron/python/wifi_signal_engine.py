import numpy as np
import time
import json
import socket
from datetime import datetime

class WiFiSignalEngine:
    """
    WiFiSignalEngine (RuView v1611)
    Simula a triangulação de sinais WiFi/Bluetooth para detecção de presença invisível e quedas.
    """
    def __init__(self, zone_id="central_hub"):
        self.zone_id = zone_id
        self.nodes = [
            {"id": "node_01", "pos": (0, 0, 2.5)},
            {"id": "node_02", "pos": (10, 0, 2.5)},
            {"id": "node_03", "pos": (5, 15, 2.5)}
        ]
        self.subjects = {} 
        self.signal_points = [] 
        self.points_of_interest = []

    def simulate_presence(self, num_subjects=3):
        for i in range(num_subjects):
            mac = f"00:1A:2B:3C:4D:5{i}"
            if mac not in self.subjects:
                self.subjects[mac] = {
                    "pos": (np.random.uniform(0, 10), np.random.uniform(0, 15)),
                    "energy": np.random.uniform(0.5, 1.0)
                }
            else:
                x, y = self.subjects[mac]["pos"]
                dx = np.random.normal(0, 0.2)
                dy = np.random.normal(0, 0.2)
                self.subjects[mac]["pos"] = (
                    np.clip(x + dx, 0, 10),
                    np.clip(y + dy, 0, 15)
                )
            self.subjects[mac]["last_seen"] = datetime.now().isoformat()

    def detect_fall(self, signal_point):
        """ Detecta queda via assinatura horizontal (v1611) """
        if signal_point.get('intensity', 0) > 0.95 and signal_point.get('y', 0) > 12:
            return True
        return False

    def add_calibration_point(self, device_id, real_x, real_y, intensity):
        point = {
            "id": f"calib_{int(time.time()*1000)}",
            "device_id": device_id,
            "x": real_x,
            "y": real_y,
            "intensity": intensity,
            "type": "calibration",
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }
        self.signal_points.append(point)
        if len(self.signal_points) > 500:
            self.signal_points.pop(0)
        return point

    def add_poi(self, poi_type, x, y, metadata=None):
        poi = {
            "id": f"poi_{poi_type}_{int(time.time()*1000)}",
            "type": poi_type,
            "x": x,
            "y": y,
            "metadata": metadata or {},
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }
        self.points_of_interest.append(poi)
        return poi

    def get_signal_map(self):
        """ Gera o mapa de sensores consolidado para o frontend """
        self.simulate_presence()
        
        telemetry = []
        for mac, data in self.subjects.items():
            point = {
                "id": mac,
                "x": round(data["pos"][0], 2),
                "y": round(data["pos"][1], 2),
                "intensity": round(data["energy"], 2),
                "timestamp": data["last_seen"],
                "fall_detected": self.detect_fall({"intensity": data["energy"], "y": data["pos"][1]})
            }
            telemetry.append(point)
            
        return {
            "zone": self.zone_id,
            "active_devices": len(self.subjects),
            "data": telemetry,
            "pois": self.points_of_interest
        }

if __name__ == "__main__":
    engine = WiFiSignalEngine()
    print("RuView WiFiSignalEngine v1611 Started...")
    while True:
        data = engine.get_signal_map()
        print(json.dumps(data, indent=2))
        time.sleep(2)
