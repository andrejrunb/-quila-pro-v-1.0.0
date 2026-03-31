"""
Módulo de Integração entre Reconhecimento Facial e Registro de Presença para o Sistema Áquila

Este módulo é responsável por integrar o sistema de reconhecimento facial com o rastreador de presença,
permitindo o registro automático de presença dos alunos com base nas detecções faciais.
"""

import logging
import threading
import time
from datetime import datetime

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('aquila.presence_tracking.integration')

class PresenceIntegrator:
    """
    Classe para integração entre reconhecimento facial e registro de presença.
    """
    
    def __init__(self, facial_recognition_system, presence_tracker, location_mapping=None):
        """
        Inicializa o integrador de presença.
        
        Args:
            facial_recognition_system: Instância do sistema de reconhecimento facial.
            presence_tracker: Instância do rastreador de presença.
            location_mapping (dict, opcional): Mapeamento entre câmeras e locais.
                Formato: {camera_id: location_id}
        """
        self.facial_recognition_system = facial_recognition_system
        self.presence_tracker = presence_tracker
        self.location_mapping = location_mapping or {}
        
        # Flag para controle da thread de integração
        self.running = False
        self.integration_thread = None
        
        logger.info("Integrador de presença inicializado")
        
    def register_camera_location(self, camera_id, location_id):
        """
        Registra o mapeamento entre uma câmera e um local.
        
        Args:
            camera_id (str): ID da câmera.
            location_id (int): ID do local.
        """
        self.location_mapping[camera_id] = location_id
        logger.info(f"Câmera {camera_id} mapeada para local {location_id}")
        
    def start_integration(self, update_interval=5):
        """
        Inicia a integração automática entre reconhecimento facial e registro de presença.
        
        Args:
            update_interval (int): Intervalo em segundos entre atualizações.
            
        Returns:
            bool: True se iniciado com sucesso, False caso contrário.
        """
        if self.running:
            logger.warning("Integração já está em execução")
            return False
            
        self.running = True
        self.integration_thread = threading.Thread(
            target=self._integration_loop,
            args=(update_interval,),
            daemon=True
        )
        
        self.integration_thread.start()
        logger.info(f"Integração iniciada com intervalo de {update_interval} segundos")
        return True
        
    def stop_integration(self):
        """
        Para a integração automática.
        
        Returns:
            bool: True se parado com sucesso, False caso contrário.
        """
        if not self.running:
            logger.warning("Integração não está em execução")
            return False
            
        self.running = False
        
        if self.integration_thread:
            self.integration_thread.join(timeout=10.0)
            self.integration_thread = None
            
        logger.info("Integração parada")
        return True
        
    def _integration_loop(self, update_interval):
        """
        Loop principal de integração.
        
        Args:
            update_interval (int): Intervalo em segundos entre atualizações.
        """
        while self.running:
            try:
                # Obter localizações atuais dos alunos do sistema de reconhecimento facial
                student_locations = self.facial_recognition_system.get_all_student_locations()
                
                # Processar cada aluno detectado
                for student_id, detection_info in student_locations.items():
                    camera_id = detection_info.get('camera_id')
                    
                    # Verificar se a câmera está mapeada para um local
                    if camera_id in self.location_mapping:
                        location_id = self.location_mapping[camera_id]
                        
                        # Atualizar localização do aluno no rastreador de presença
                        self.presence_tracker.update_student_location(student_id, location_id)
                        logger.debug(f"Aluno {student_id} atualizado para local {location_id}")
                    else:
                        logger.warning(f"Câmera {camera_id} não está mapeada para nenhum local")
                
                # Aguardar próxima atualização
                time.sleep(update_interval)
                
            except Exception as e:
                logger.error(f"Erro durante integração: {str(e)}")
                time.sleep(update_interval)  # Continuar mesmo após erro
                
        logger.info("Loop de integração finalizado")
        
    def manual_update(self):
        """
        Realiza uma atualização manual da integração.
        
        Returns:
            int: Número de atualizações realizadas.
        """
        try:
            # Obter localizações atuais dos alunos do sistema de reconhecimento facial
            student_locations = self.facial_recognition_system.get_all_student_locations()
            
            update_count = 0
            
            # Processar cada aluno detectado
            for student_id, detection_info in student_locations.items():
                camera_id = detection_info.get('camera_id')
                
                # Verificar se a câmera está mapeada para um local
                if camera_id in self.location_mapping:
                    location_id = self.location_mapping[camera_id]
                    
                    # Atualizar localização do aluno no rastreador de presença
                    if self.presence_tracker.update_student_location(student_id, location_id):
                        update_count += 1
                        
            logger.info(f"Atualização manual concluída: {update_count} atualizações realizadas")
            return update_count
            
        except Exception as e:
            logger.error(f"Erro durante atualização manual: {str(e)}")
            return 0
            
    def get_student_status(self, student_id):
        """
        Obtém o status completo de um aluno, combinando informações de reconhecimento facial e presença.
        
        Args:
            student_id (str): ID do aluno.
            
        Returns:
            dict: Status completo do aluno.
        """
        try:
            # Obter informações de reconhecimento facial
            facial_info = self.facial_recognition_system.get_student_location(student_id)
            
            # Obter informações de presença
            presence_info = self.presence_tracker.get_student_location(student_id)
            
            # Combinar informações
            status = {
                'student_id': student_id,
                'timestamp': datetime.now().isoformat(),
                'facial_recognition': facial_info,
                'presence_tracking': presence_info
            }
            
            return status
            
        except Exception as e:
            logger.error(f"Erro ao obter status do aluno {student_id}: {str(e)}")
            return {
                'student_id': student_id,
                'timestamp': datetime.now().isoformat(),
                'error': str(e)
            }
            
    def get_all_students_status(self):
        """
        Obtém o status de todos os alunos detectados.
        
        Returns:
            dict: Mapeamento de IDs de alunos para seus status.
        """
        try:
            # Obter todos os alunos detectados pelo reconhecimento facial
            facial_locations = self.facial_recognition_system.get_all_student_locations()
            
            # Obter todos os alunos registrados no rastreador de presença
            presence_locations = self.presence_tracker.get_all_student_locations()
            
            # Combinar as listas de alunos
            all_students = set(list(facial_locations.keys()) + list(presence_locations.keys()))
            
            # Obter status de cada aluno
            status = {}
            for student_id in all_students:
                status[student_id] = self.get_student_status(student_id)
                
            return status
            
        except Exception as e:
            logger.error(f"Erro ao obter status de todos os alunos: {str(e)}")
            return {}
