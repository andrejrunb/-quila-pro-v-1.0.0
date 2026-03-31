from onvif import ONVIFCamera
from onvif.exceptions import ONVIFError
import socket
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

class ONVIFDetector:
    def __init__(self):
        self.devices = []

    def discover_devices(self, timeout=5):
        logging.info(f"Iniciando descoberta de dispositivos ONVIF na rede (timeout: {timeout}s)...")
        self.devices = []
        try:
            # ONVIFCamera.discover() usa WS-Discovery para encontrar dispositivos
            # Pode ser necessário ajustar o timeout ou o método de descoberta dependendo da rede
            # A biblioteca onvif-python pode ter um método de descoberta mais direto ou usar wsdiscovery
            # Para simplicidade, vamos simular uma descoberta ou usar um método conhecido se disponível
            # A documentação sugere usar wsdiscovery para descoberta, mas a ONVIFCamera pode ter um wrapper
            # Vamos tentar uma abordagem mais direta com a ONVIFCamera se ela suportar descoberta broadcast
            # Ou usar uma biblioteca dedicada como 'wsdiscovery' se necessário.
            
            # A biblioteca 'onvif-python' (nirsimetri) não tem um método discover() direto como 'python-onvif' (quatanium)
            # Para descoberta, geralmente se usa wsdiscovery. Vamos simular ou usar um método alternativo.
            # Para este exemplo, vamos assumir que temos um IP conhecido para testar.
            
            # Uma forma comum de descoberta é via WS-Discovery. A biblioteca 'python-onvif' (quatanium) tem um método discover.
            # Se usarmos 'onvif-python' (nirsimetri), teríamos que implementar WS-Discovery separadamente ou usar um IP conhecido.
            
            # Para o propósito de demonstração e para evitar dependências adicionais de wsdiscovery neste script,
            # vamos focar na conexão a um dispositivo ONVIF com IP e credenciais conhecidas.
            # A descoberta real seria um passo anterior que forneceria esses IPs.
            
            logging.warning("A descoberta automática de dispositivos ONVIF (WS-Discovery) não está implementada diretamente neste script usando 'onvif-python'.")
            logging.warning("Para descoberta, considere usar a biblioteca 'wsdiscovery' ou 'python-onvif' (quatanium).")
            logging.info("Este script focará na conexão e obtenção de informações de um dispositivo ONVIF com IP e credenciais conhecidas.")

            # Exemplo de como conectar a um dispositivo ONVIF conhecido
            # Para descoberta, precisaríamos de um loop com wsdiscovery.find_services()
            # ou usar a funcionalidade de 'python-onvif' (quatanium) que tem um discover() mais fácil.
            
            # Vamos adicionar um placeholder para a descoberta real, e focar na funcionalidade de conexão.
            # Para a descoberta, o ideal seria usar algo como:
            # from wsdiscovery.discovery import ThreadedWSDiscovery as WSDiscovery
            # ws = WSDiscovery()
            # ws.start()
            # services = ws.search_services()
            # for service in services:
            #     # Processar o serviço para obter o IP e porta
            #     # E então tentar conectar com ONVIFCamera
            # ws.stop()

            # Para o escopo atual, vamos apenas retornar um dispositivo de exemplo.
            # Em um cenário real, esta função seria alimentada por IPs descobertos.
            
            # Simulação de um dispositivo descoberto para fins de teste
            # Em um ambiente real, você obteria esses dados de um processo de descoberta.
            self.devices.append({
                'ip': '192.168.1.100', # IP de exemplo
                'port': 80,           # Porta de exemplo
                'username': 'admin',  # Usuário de exemplo
                'password': 'admin123' # Senha de exemplo
            })
            logging.info(f"Dispositivo ONVIF de exemplo adicionado para teste: {self.devices[0]['ip']}")

        except Exception as e:
            logging.error(f"Erro durante a descoberta de dispositivos ONVIF: {e}")
        return self.devices

    def get_camera_info(self, ip, port, username, password):
        logging.info(f"Conectando ao dispositivo ONVIF em {ip}:{port}...")
        try:
            mycam = ONVIFCamera(ip, port, username, password, 
                                wsdl_dir=".") # wsdl_dir pode precisar ser configurado
            
            # Obter serviços
            media_service = mycam.create_media_service()
            ptz_service = mycam.create_ptz_service()
            
            # Obter perfis de mídia (streams)
            profiles = media_service.GetProfiles()
            
            camera_info = {
                'ip': ip,
                'port': port,
                'username': username,
                'rtsp_urls': [],
                'ptz_supported': False
            }

            for profile in profiles:
                token = profile.token
                # Obter URI do stream RTSP
                try:
                    stream_setup = mycam.create_type("GetStreamUri")
                    stream_setup.ProfileToken = token
                    stream_setup.StreamSetup = {
                        'Stream': 'RTP_unicast',
                        'Transport': {'Protocol': 'RTSP'}
                    }
                    uri = media_service.GetStreamUri(stream_setup)
                    camera_info['rtsp_urls'].append(uri.Uri)
                except ONVIFError as e:
                    logging.warning(f"Não foi possível obter URI RTSP para o perfil {token}: {e}")

            # Verificar suporte a PTZ
            try:
                ptz_configs = ptz_service.GetConfigurations()
                if ptz_configs:
                    camera_info['ptz_supported'] = True
            except ONVIFError:
                camera_info['ptz_supported'] = False

            logging.info(f"Informações da câmera {ip} obtidas com sucesso.")
            return camera_info

        except ONVIFError as e:
            logging.error(f"Erro ONVIF ao conectar ou obter informações da câmera {ip}: {e}")
            return None
        except socket.timeout:
            logging.error(f"Timeout ao conectar à câmera {ip}:{port}.")
            return None
        except Exception as e:
            logging.error(f"Erro inesperado ao processar câmera {ip}: {e}")
            return None

if __name__ == '__main__':
    detector = ONVIFDetector()
    
    # Para testar a descoberta, você precisaria de uma biblioteca WS-Discovery
    # ou de uma implementação de descoberta na rede.
    # Por enquanto, vamos usar um dispositivo de exemplo.
    
    # devices = detector.discover_devices() # Isso retornaria o dispositivo de exemplo
    # if devices:
    #     for dev in devices:
    #         info = detector.get_camera_info(dev['ip'], dev['port'], dev['username'], dev['password'])
    #         if info:
    #             print("\n--- Detalhes da Câmera ONVIF ---")
    #             print(f"IP: {info['ip']}")
    #             print(f"Porta: {info['port']}")
    #             print(f"URLs RTSP: {info['rtsp_urls']}")
    #             print(f"PTZ Suportado: {info['ptz_supported']}")
    # else:
    #     print("Nenhum dispositivo ONVIF descoberto ou configurado para teste.")

    # Exemplo de uso direto com credenciais conhecidas (substitua pelos seus dados reais)
    print("\n--- Teste de Conexão Direta ONVIF (Substitua pelos seus dados reais) ---")
    test_ip = '192.168.1.100' # Substitua pelo IP da sua câmera ONVIF
    test_port = 80            # Substitua pela porta HTTP/ONVIF da sua câmera
    test_username = 'admin'   # Substitua pelo usuário da sua câmera
    test_password = 'admin123'# Substitua pela senha da sua câmera

    # Para que a biblioteca 'onvif-python' funcione, ela precisa dos arquivos WSDL.
    # Você pode baixá-los de https://www.onvif.org/profiles/specifications/
    # e colocá-los em um diretório 'wsdl' na raiz do projeto ou especificar o caminho.
    # Por simplicidade, estou usando wsdl_dir="." que espera os WSDLs no diretório atual.
    # É altamente recomendável criar um diretório 'wsdl' e apontar para ele.

    print("Certifique-se de ter os arquivos WSDL da ONVIF no diretório correto (ex: ./wsdl).")
    print("Você pode baixá-los de https://www.onvif.org/profiles/specifications/")
    print(f"Tentando obter informações da câmera em {test_ip}...")
    camera_details = detector.get_camera_info(test_ip, test_port, test_username, test_password)

    if camera_details:
        print("\n--- Detalhes da Câmera ONVIF ---")
        print(f"IP: {camera_details['ip']}")
        print(f"Porta: {camera_details['port']}")
        print(f"URLs RTSP: {camera_details['rtsp_urls']}")
        print(f"PTZ Suportado: {camera_details['ptz_supported']}")
    else:
        print("Falha ao obter detalhes da câmera ONVIF.")
