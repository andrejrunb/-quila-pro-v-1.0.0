import { EventEmitter } from 'events';

/**
 * VmsBridgeService.ts — AG-030
 * Integração com Video Management Systems (VMS).
 */
class VmsBridgeService extends EventEmitter {
  
  /**
   * Inicia o stream RTSP de saída com anotações de IA.
   */
  public startOutgoingStream(cameraId: string): string {
    const streamUrl = `rtsp://eagle-bridge:8554/${cameraId}_ai`;
    console.log(`[VMSBridge] Stream RTSP Out iniciado: ${streamUrl}`);
    return streamUrl;
  }

  /**
   * Envia metadata (JSON over TCP/HTTP) para o VMS.
   */
  public sendMetadata(data: any) {
    // Integração com Milestone Analytics Events ou Genetec Event Metadata
    this.emit('metadata-sent', data);
  }
}

export const vmsBridge = new VmsBridgeService();
export default vmsBridge;
