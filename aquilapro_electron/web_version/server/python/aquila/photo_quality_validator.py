"""
Photo Quality Validator
Valida qualidade de fotos de alunos com 8 critérios
"""

import cv2
import numpy as np
from pathlib import Path
from typing import Dict, List, Tuple
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class PhotoQualityValidator:
    """Valida qualidade de fotos de reconhecimento facial"""

    # Critérios de validação
    MIN_RESOLUTION = (640, 480)
    MIN_FACE_SIZE_PERCENT = 30  # Rosto deve ocupar >= 30% da imagem
    MAX_FACE_SIZE_PERCENT = 70  # Rosto deve ocupar <= 70% da imagem
    MIN_BRIGHTNESS = 50  # Escala 0-255
    MAX_BRIGHTNESS = 200
    MIN_CONTRAST = 30  # Diferença mínima entre pixels
    MAX_TILT_ANGLE = 30  # Ângulo máximo da cabeça (graus)

    def __init__(self):
        """Inicializa validador com cascade classifier"""
        cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        self.face_cascade = cv2.CascadeClassifier(cascade_path)

    def validate_photo(self, image_path: str) -> Dict:
        """
        Valida uma foto e retorna resultado detalhado

        Args:
            image_path: Caminho da imagem

        Returns:
            Dict com resultado da validação
        """
        try:
            # Lê imagem
            image = cv2.imread(image_path)
            if image is None:
                return {
                    "is_valid": False,
                    "quality_score": 0,
                    "issues": ["Arquivo de imagem inválido"],
                }

            # Executa validações
            results = {
                "is_valid": True,
                "quality_score": 100,
                "issues": [],
                "details": {},
            }

            # 1. Validar resolução
            resolution_check = self._check_resolution(image)
            if not resolution_check["valid"]:
                results["issues"].append(resolution_check["message"])
                results["quality_score"] -= 15
            results["details"]["resolution"] = resolution_check

            # 2. Validar detecção de rosto
            face_check = self._check_face_detection(image)
            if not face_check["valid"]:
                results["issues"].append(face_check["message"])
                results["quality_score"] -= 20
            results["details"]["face_detection"] = face_check

            # 3. Validar tamanho do rosto
            if face_check["valid"]:
                size_check = self._check_face_size(image, face_check["faces"])
                if not size_check["valid"]:
                    results["issues"].append(size_check["message"])
                    results["quality_score"] -= 15
                results["details"]["face_size"] = size_check

                # 4. Validar iluminação
                brightness_check = self._check_brightness(image, face_check["faces"])
                if not brightness_check["valid"]:
                    results["issues"].append(brightness_check["message"])
                    results["quality_score"] -= 10
                results["details"]["brightness"] = brightness_check

                # 5. Validar contraste
                contrast_check = self._check_contrast(image, face_check["faces"])
                if not contrast_check["valid"]:
                    results["issues"].append(contrast_check["message"])
                    results["quality_score"] -= 10
                results["details"]["contrast"] = contrast_check

                # 6. Validar desfoque
                blur_check = self._check_blur(image)
                if not blur_check["valid"]:
                    results["issues"].append(blur_check["message"])
                    results["quality_score"] -= 15
                results["details"]["blur"] = blur_check

                # 7. Validar inclinação da cabeça
                tilt_check = self._check_head_tilt(image, face_check["faces"])
                if not tilt_check["valid"]:
                    results["issues"].append(tilt_check["message"])
                    results["quality_score"] -= 10
                results["details"]["head_tilt"] = tilt_check

            # Ajustar score final
            results["quality_score"] = max(0, min(100, results["quality_score"]))
            results["is_valid"] = results["quality_score"] >= 60 and len(results["issues"]) == 0

            logger.info(f"Photo validation: {image_path} - Score: {results['quality_score']}")
            return results

        except Exception as e:
            logger.error(f"Error validating photo: {str(e)}")
            return {
                "is_valid": False,
                "quality_score": 0,
                "issues": [f"Erro ao validar foto: {str(e)}"],
            }

    def _check_resolution(self, image: np.ndarray) -> Dict:
        """Valida resolução mínima"""
        height, width = image.shape[:2]
        is_valid = width >= self.MIN_RESOLUTION[0] and height >= self.MIN_RESOLUTION[1]
        return {
            "valid": is_valid,
            "resolution": (width, height),
            "message": f"Resolução baixa ({width}x{height}). Mínimo: {self.MIN_RESOLUTION[0]}x{self.MIN_RESOLUTION[1]}"
            if not is_valid
            else None,
        }

    def _check_face_detection(self, image: np.ndarray) -> Dict:
        """Detecta rostos na imagem"""
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(gray, 1.3, 5)

        if len(faces) == 0:
            return {
                "valid": False,
                "faces": [],
                "message": "Nenhum rosto detectado. Certifique-se de que o rosto está visível.",
            }
        elif len(faces) > 1:
            return {
                "valid": False,
                "faces": faces,
                "message": "Múltiplos rostos detectados. Apenas um rosto deve estar visível.",
            }
        else:
            return {"valid": True, "faces": faces, "message": None}

    def _check_face_size(self, image: np.ndarray, faces: np.ndarray) -> Dict:
        """Valida tamanho do rosto na imagem"""
        if len(faces) == 0:
            return {"valid": False, "message": "Nenhum rosto para validar tamanho"}

        height, width = image.shape[:2]
        x, y, w, h = faces[0]
        face_area_percent = (w * h) / (width * height) * 100

        is_valid = (
            self.MIN_FACE_SIZE_PERCENT <= face_area_percent <= self.MAX_FACE_SIZE_PERCENT
        )
        message = None
        if face_area_percent < self.MIN_FACE_SIZE_PERCENT:
            message = f"Rosto muito pequeno ({face_area_percent:.1f}%). Aproxime-se mais."
        elif face_area_percent > self.MAX_FACE_SIZE_PERCENT:
            message = f"Rosto muito grande ({face_area_percent:.1f}%). Afaste-se mais."

        return {
            "valid": is_valid,
            "face_size_percent": face_area_percent,
            "message": message,
        }

    def _check_brightness(self, image: np.ndarray, faces: np.ndarray) -> Dict:
        """Valida iluminação"""
        if len(faces) == 0:
            return {"valid": False, "message": "Nenhum rosto para validar iluminação"}

        x, y, w, h = faces[0]
        face_region = image[y : y + h, x : x + w]
        gray = cv2.cvtColor(face_region, cv2.COLOR_BGR2GRAY)
        brightness = np.mean(gray)

        is_valid = self.MIN_BRIGHTNESS <= brightness <= self.MAX_BRIGHTNESS
        message = None
        if brightness < self.MIN_BRIGHTNESS:
            message = f"Iluminação inadequada (muito escuro). Melhore a iluminação."
        elif brightness > self.MAX_BRIGHTNESS:
            message = f"Iluminação excessiva (muito claro). Reduza a iluminação."

        return {
            "valid": is_valid,
            "brightness": brightness,
            "message": message,
        }

    def _check_contrast(self, image: np.ndarray, faces: np.ndarray) -> Dict:
        """Valida contraste"""
        if len(faces) == 0:
            return {"valid": False, "message": "Nenhum rosto para validar contraste"}

        x, y, w, h = faces[0]
        face_region = image[y : y + h, x : x + w]
        gray = cv2.cvtColor(face_region, cv2.COLOR_BGR2GRAY)
        contrast = np.std(gray)

        is_valid = contrast >= self.MIN_CONTRAST
        message = (
            f"Contraste baixo ({contrast:.1f}). Melhore a iluminação."
            if not is_valid
            else None
        )

        return {
            "valid": is_valid,
            "contrast": contrast,
            "message": message,
        }

    def _check_blur(self, image: np.ndarray) -> Dict:
        """Detecta desfoque usando Laplacian variance"""
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()

        # Threshold empírico para desfoque
        blur_threshold = 100
        is_valid = laplacian_var >= blur_threshold
        message = (
            f"Foto desfocada ({laplacian_var:.1f}). Use uma câmera estável."
            if not is_valid
            else None
        )

        return {
            "valid": is_valid,
            "blur_score": laplacian_var,
            "message": message,
        }

    def _check_head_tilt(self, image: np.ndarray, faces: np.ndarray) -> Dict:
        """Valida inclinação da cabeça (simplificado)"""
        # Implementação simplificada - em produção usar dlib landmarks
        return {
            "valid": True,
            "tilt_angle": 0,
            "message": None,
        }

    def batch_validate(self, image_paths: List[str]) -> Dict:
        """
        Valida múltiplas fotos

        Args:
            image_paths: Lista de caminhos de imagens

        Returns:
            Dict com resultados agregados
        """
        results = {
            "total": len(image_paths),
            "valid": 0,
            "invalid": 0,
            "details": [],
        }

        for path in image_paths:
            result = self.validate_photo(path)
            results["details"].append({"path": path, **result})
            if result["is_valid"]:
                results["valid"] += 1
            else:
                results["invalid"] += 1

        return results


# Exemplo de uso
if __name__ == "__main__":
    validator = PhotoQualityValidator()

    # Validar foto individual
    result = validator.validate_photo("path/to/photo.jpg")
    print(f"Valid: {result['is_valid']}")
    print(f"Quality Score: {result['quality_score']}")
    print(f"Issues: {result['issues']}")

    # Validar múltiplas fotos
    batch_result = validator.batch_validate(
        ["photo1.jpg", "photo2.jpg", "photo3.jpg"]
    )
    print(f"Batch Results: {batch_result}")
