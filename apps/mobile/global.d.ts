declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_GATEWAY_HOST?: string;
    EXPO_PUBLIC_USE_SSL?: string;
    EXPO_PUBLIC_COLAB_GPU_URL?: string;
    [key: string]: string | undefined;
  }
  interface Process {
    env: ProcessEnv;
  }
}

declare const process: NodeJS.Process;
