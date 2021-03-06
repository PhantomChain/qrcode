/**
 * This is an autogenerated file created by the Stencil compiler.
 * It contains typing information for all components that exist in this project.
 */

import '@stencil/core';

declare global {
  namespace JSX {
    interface Element {}
    export interface IntrinsicElements {}
  }
  namespace JSXElements {}

  interface HTMLElement {
    componentOnReady?: () => Promise<this | null>;
  }

  interface HTMLStencilElement extends HTMLElement {
    componentOnReady(): Promise<this>;

    forceUpdate(): void;
  }

  interface HTMLAttributes {}
}

import {
  Element,
} from '@stencil/core';

declare global {

  namespace StencilComponents {
    interface PhantomQrcode {
      'address': string;
      'amount': number;
      'deserializeURI': (uri: string) => { address: any; amount: any; label: any; vendorField: any; };
      'fromObject': (data: any) => Element;
      'getDataURL': (mime?: string) => string;
      'getURI': () => string;
      'label': string;
      'showLogo': boolean;
      'size': number;
      'validateURI': (uri: string) => RegExpExecArray;
      'vendorField': string;
    }
  }

  interface HTMLPhantomQrcodeElement extends StencilComponents.PhantomQrcode, HTMLStencilElement {}

  var HTMLPhantomQrcodeElement: {
    prototype: HTMLPhantomQrcodeElement;
    new (): HTMLPhantomQrcodeElement;
  };
  interface HTMLElementTagNameMap {
    'phantom-qrcode': HTMLPhantomQrcodeElement;
  }
  interface ElementTagNameMap {
    'phantom-qrcode': HTMLPhantomQrcodeElement;
  }
  namespace JSX {
    interface IntrinsicElements {
      'phantom-qrcode': JSXElements.PhantomQrcodeAttributes;
    }
  }
  namespace JSXElements {
    export interface PhantomQrcodeAttributes extends HTMLAttributes {
      'address'?: string;
      'amount'?: number;
      'label'?: string;
      'showLogo'?: boolean;
      'size'?: number;
      'vendorField'?: string;
    }
  }
}

declare global { namespace JSX { interface StencilJSX {} } }
