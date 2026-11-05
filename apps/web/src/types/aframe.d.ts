import React from 'react';

type AFrameElementProps = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLElement>,
  HTMLElement
> &
  Record<string, unknown>;

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'a-scene': AFrameElementProps;
      'a-sky': AFrameElementProps;
      'a-box': AFrameElementProps;
      'a-plane': AFrameElementProps;
      'a-light': AFrameElementProps;
      'a-entity': AFrameElementProps;
      'a-camera': AFrameElementProps;
    }
  }
}

declare namespace React {
  namespace JSX {
    interface IntrinsicElements {
      'a-scene': AFrameElementProps;
      'a-sky': AFrameElementProps;
      'a-box': AFrameElementProps;
      'a-plane': AFrameElementProps;
      'a-light': AFrameElementProps;
      'a-entity': AFrameElementProps;
      'a-camera': AFrameElementProps;
    }
  }
}
