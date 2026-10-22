import React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'a-scene': any;
      'a-sky': any;
      'a-box': any;
      'a-plane': any;
      'a-light': any;
      'a-entity': any;
      'a-camera': any;
    }
  }
}

declare namespace React {
  namespace JSX {
    interface IntrinsicElements {
      'a-scene': any;
      'a-sky': any;
      'a-box': any;
      'a-plane': any;
      'a-light': any;
      'a-entity': any;
      'a-camera': any;
    }
  }
}
