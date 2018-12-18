import { Component, Prop, Watch, State, Method, Element } from '@stencil/core';
import QRious from 'qrious';

@Component({
  tag: 'phantom-qrcode',
  styleUrl: 'phantom-qrcode.scss',
  shadow: true
})
export class PhantomQRCode {
  @Element() element: Element;

  @Prop({ mutable: true }) address: string;
  @Prop({ mutable: true }) amount: number;
  @Prop({ mutable: true }) label: string;
  @Prop({ mutable: true }) vendorField: string;
  @Prop({ mutable: true }) size: number = 100;
  @Prop({ mutable: true }) showLogo: boolean = false;

  @State() isLoad: boolean;

  @Watch('address')
  validateAddress () {
    const pattern = /^[AaDd]{1}[0-9a-zA-Z]{33}$/g;

    if (!this.address) throw new Error('address: required');
    if (this.address && !this.address.match(pattern)) throw new Error('address: not valid phantom recipient');
  }

  @Watch('amount')
  validateAmount () {
    if (typeof this.amount !== 'number' || this.amount < 0) throw new Error('amount: invalid amount');
  }

  @Watch('vendorField')
  validateVendorField () {
    if (typeof this.vendorField !== 'string') throw new Error('vendorField: must be a UTF-8 encoded string');
    if (decodeURIComponent(this.vendorField).length > 64) throw new Error('vendorField: enter no more than 64 characters');
  }

  @Watch('size')
  validateSize () {
    if (typeof this.size !== 'number') throw new Error('size: must be a number');
  }

  @Watch('showLogo')
  validateShowLogo () {
    if (typeof this.showLogo !== 'boolean') throw new Error('show-logo: must be a boolean');
    if (this.showLogo && this.size < 150) throw new Error('show-logo: to display the logo the size must be greater than 150');
  }

  @Method()
  getURI(): string {
    if (!this.isLoad) throw new Error('component not loaded');

    return this.generateSchema();
  }

  @Method()
  getDataURL(mime: string = 'image/png') {
    const canvas = this.element.shadowRoot.querySelector('canvas');

    if (!canvas) throw new Error('qrcode element not generated');

    return canvas.toDataURL(mime);
  }

  @Method()
  deserializeURI(uri: string) {
    let validate = this.validateURI(uri);

    if (!validate) return;

    const queryString = {};
    const regex = new RegExp('([^?=&]+)(=([^&]*))?', 'g');
    validate[2].replace(regex, (_, $1, __, $3) => queryString[$1] = $3)

    const scheme = { address: null, amount: null, label: null, vendorField: null };

    for (let prop in scheme) {
      scheme[prop] = queryString[prop];
    }

    scheme.address = validate[1]
    scheme.amount = scheme.amount ? Number(scheme.amount) : null
    scheme.label = scheme.label ? this.fullyDecodeURI(scheme.label) : null
    scheme.vendorField = scheme.vendorField ? this.fullyDecodeURI(scheme.vendorField) : null

    return scheme;
  }

  @Method()
  validateURI(uri: string) {
    const regex = new RegExp(/^(?:xph:)([AaDd]{1}[0-9a-zA-Z]{33})([-a-zA-Z0-9+&@#\/%=~_|$?!:,.]*)$/);

    if (regex.test(uri)) return regex.exec(uri)
  }

  @Method()
  fromObject(data: any): Element {
    this.address = data['address'];
    this.amount = data['amount'];
    this.label = data['label'];
    this.vendorField = data['vendorField'];
    this.size = data['size'];
    this.showLogo = data['showLogo'];

    this.isLoad = true;

    return this.element;
  }

  generateSchema(): string {
    const params = this.formatParams();
    const uri = `xph:${this.address}${params}`;

    const scheme = JSON.parse(JSON.stringify(uri));

    return scheme;
  }

  generateQRCode(scheme: string): QRious {
    const level = this.showLogo ? 'M' : 'L';

    const qr = new QRious({
      element: this.element.shadowRoot.querySelector('canvas'),
      value: scheme,
      size: this.size,
      level,
    });

    return this.drawLogo(qr);
  }

  drawLogo(qr: QRious): void {
    if (!this.showLogo) return;

    const ctx = this.element.shadowRoot.querySelector('canvas').getContext('2d');
    const img = new Image();

    img.onload = () => {
      const logoWidth = img.width;
      const logoHeight = img.height;
      const width = qr.size / 3.5;
      const height = logoHeight / logoWidth * width;
      var x = (qr.size / 2) - (width / 2);
      var y = (qr.size / 2) - (height / 2);
      var maskPadding = qr.size / 50;

      ctx.globalCompositeOperation = 'destination-out';
      ctx.drawImage(img, 0, 0, logoWidth, logoHeight, x - maskPadding, y - maskPadding, width + (maskPadding * 2), height + (maskPadding * 2));

      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(img, 0, 0, logoWidth, logoHeight, x, y, width, height);
    }

    img.src = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz48c3ZnIHZlcnNpb249IjEuMSIgaWQ9InN2ZzAiIGlua3NjYXBlOnZlcnNpb249IjAuOTIuMiA1YzNlODBkLCAyMDE3LTA4LTA2IiBzb2RpcG9kaTpkb2NuYW1lPSJhcmtjbGllbnQuc3ZnIiB4bWxuczpjYz0iaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbnMjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOmlua3NjYXBlPSJodHRwOi8vd3d3Lmlua3NjYXBlLm9yZy9uYW1lc3BhY2VzL2lua3NjYXBlIiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiIHhtbG5zOnNvZGlwb2RpPSJodHRwOi8vc29kaXBvZGkuc291cmNlZm9yZ2UubmV0L0RURC9zb2RpcG9kaS0wLmR0ZCIgeG1sbnM6c3ZnPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgeD0iMHB4IiB5PSIwcHgiIHZpZXdCb3g9IjAgMCA1MTIgNTEyIiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA1MTIgNTEyOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+PHN0eWxlIHR5cGU9InRleHQvY3NzIj4uc3Qwe2ZpbGw6I0ZGRkZGRjt9LnN0MXtmaWxsOiM2QTc4OTg7c3Ryb2tlOiM0RDVDODc7c3Ryb2tlLW1pdGVybGltaXQ6MTA7fS5zdDJ7ZmlsbDojNkE3Nzk4O3N0cm9rZTojNEQ1Qzg3O3N0cm9rZS1taXRlcmxpbWl0OjEwO30uc3Qze3N0cm9rZTojMDAwMDAwO3N0cm9rZS1taXRlcmxpbWl0OjEwO308L3N0eWxlPjxzb2RpcG9kaTpuYW1lZHZpZXcgIGJvcmRlcmNvbG9yPSIjNjY2NjY2IiBib3JkZXJvcGFjaXR5PSIxLjAiIGlkPSJiYXNlIiBpbmtzY2FwZTpjdXJyZW50LWxheWVyPSJsYXllcjAiIGlua3NjYXBlOmN4PSItMjkuNDU2ODUyIiBpbmtzY2FwZTpjeT0iMzgxLjIwNTI4IiBpbmtzY2FwZTpkb2N1bWVudC11bml0cz0ibW0iIGlua3NjYXBlOmd1aWRlLWJib3g9InRydWUiIGlua3NjYXBlOnBhZ2VvcGFjaXR5PSIwLjAiIGlua3NjYXBlOnBhZ2VzaGFkb3c9IjIiIGlua3NjYXBlOndpbmRvdy1oZWlnaHQ9Ijk1NyIgaW5rc2NhcGU6d2luZG93LW1heGltaXplZD0iMCIgaW5rc2NhcGU6d2luZG93LXdpZHRoPSIxNjU3IiBpbmtzY2FwZTp3aW5kb3cteD0iMjI4IiBpbmtzY2FwZTp3aW5kb3cteT0iNDUiIGlua3NjYXBlOnpvb209IjAuNzA3MTA2NzgiIHBhZ2Vjb2xvcj0iI2ZmZmZmZiIgc2hvd2dyaWQ9InRydWUiIHNob3dndWlkZXM9InRydWUiIHVuaXRzPSJweCI+PGlua3NjYXBlOmdyaWQgIGlkPSJncmlkNDUxNyIgdHlwZT0ieHlncmlkIj48L2lua3NjYXBlOmdyaWQ+PHNvZGlwb2RpOmd1aWRlICBpZD0iZ3VpZGU0NTIyIiBpbmtzY2FwZTpjb2xvcj0icmdiKDAsMCwyNTUpIiBpbmtzY2FwZTpsYWJlbD0iIiBpbmtzY2FwZTpsb2NrZWQ9ImZhbHNlIiBvcmllbnRhdGlvbj0iMSwwIiBwb3NpdGlvbj0iNjcuNzMzMzMsMCI+PC9zb2RpcG9kaTpndWlkZT48c29kaXBvZGk6Z3VpZGUgIGlkPSJndWlkZTQ1MjQiIGlua3NjYXBlOmNvbG9yPSJyZ2IoMCwwLDI1NSkiIGlua3NjYXBlOmxhYmVsPSIiIGlua3NjYXBlOmxvY2tlZD0iZmFsc2UiIG9yaWVudGF0aW9uPSIwLDEiIHBvc2l0aW9uPSIwLDY3LjczMzMzIj48L3NvZGlwb2RpOmd1aWRlPjxzb2RpcG9kaTpndWlkZSAgaWQ9Imd1aWRlNDUzMiIgaW5rc2NhcGU6bG9ja2VkPSJmYWxzZSIgb3JpZW50YXRpb249IjAsMSIgcG9zaXRpb249IjEwOC40NzkxNiwzOS42ODc0OTgiPjwvc29kaXBvZGk6Z3VpZGU+PC9zb2RpcG9kaTpuYW1lZHZpZXc+PHBhdGggY2xhc3M9InN0MCIgZD0iTTQwOS4xLDQ2MS43bC0yMDIuNSw0NGMtMTgsMy45LTM2LjctMi4yLTQ5LjItMTUuOUwxNi44LDMzNUM0LjMsMzIxLjIsMCwzMDEuOSw1LjUsMjg0LjNMNjcuNCw4NS41YzUuNS0xNy43LDIwLTMwLjksMzcuOS0zNC44bDIwMi41LTQ0YzE4LTMuOSwzNi43LDIuMiw0OS4yLDE1LjlsMTQwLjYsMTU0LjhjMTIuNSwxMy43LDE2LjgsMzMuMSwxMS4zLDUwLjdsLTYxLjksMTk4LjhDNDQxLjYsNDQ0LjUsNDI3LjEsNDU3LjgsNDA5LjEsNDYxLjd6Ii8+PGc+PGc+PHBhdGggY2xhc3M9InN0MSIgZD0iTTUwNSwyMDIuM2wtMC4zLTEuNWMtMy41LTE1LjgtMTkuMS0yNS43LTM0LjgtMjIuM2wtMS41LDAuM2MtMC44LDAuMi0xLjUsMC40LTIuMSwwLjZMMzUzLDU1LjdjMi4zLTUuNCwzLTExLjYsMS42LTE3LjdsLTAuMy0xLjVjLTMuNS0xNS44LTE5LjEtMjUuNy0zNC44LTIyLjNsLTEuNSwwLjJjLTEwLjYsMi4zLTE4LjgsOS42LTIxLjksMTguM2MtMy4yLDguNi0yLjksMTQuNi0yLjksMTguMWMwLDMuNSwzLjIsMTEuOCwzLjIsMTEuOGMtMTkuMiwxOC40LTM4LjEsNDYuNy01NS4zLDgwYzYuNiw1LjMsMTMuMSwxMC43LDE5LjQsMTYuNGMyMS42LTQyLjUsNDMuOC03MS43LDYxLjEtODUuNGMzLDAuMyw2LjIsMC4yLDkuMy0wLjVsMS41LTAuM2MwLjgtMC4xLDEuNS0wLjQsMi4xLTAuNmwxMTMuMywxMjRjLTEuOCw0LjItMi42LDguOS0yLjIsMTMuNmMtMjUuOCwyNC41LTg5LjMsNTYuNS0xODAuOSw3Ni43Yy0xNC4xLDMuMi0yNy45LDUuNi00MSw3LjdjLTIuMyw5LTQuMywxNy42LTYsMjUuOWMxNy4zLTIuNSwzNC45LTUuNyw1Mi4zLTkuNmM2OC0xNSwxMzQuMy0zOS43LDE3NC41LTY4LjJsMTAuOS04LjhsNywzLjVjMTAuNSwzLjUsMjAuNSwwLjEsMjAuNSwwLjFDNDk4LjYsMjMzLjcsNTA4LjUsMjE4LjEsNTA1LDIwMi4zIi8+PHBhdGggY2xhc3M9InN0MiIgZD0iTTIyNS44LDI0My40YzQuNC0xMy4xLDguOS0yNS40LDEzLjUtMzcuMmMtNi44LTYuMi0xMy4zLTExLjktMTkuNi0xNy4zYy02LjMsMTUuMi0xMi4xLDMwLjktMTcuNCw0Ni42Yy0yNC45LDc0LjgtMzQuOCwxNDQuMi0yOC4yLDE4OWwyNC44LTEuNkMxOTMuMSwzODcuNiwxOTguOSwzMjQuMiwyMjUuOCwyNDMuNCIvPjxwYXRoIGNsYXNzPSJzdDMiIGQ9Ik00MzcuNCw0MTMuM2MtMS40LTYuMi00LjUtMTEuNC05LTE1LjRsNDcuMy0xNDkuNGwtMjQuMi01LjVsLTQ0LjIsMTM5LjZjLTUuNC0yNC40LTE5LjktNTQuNi00MS42LTg3Yy03LjksMi45LTE2LDUuNy0yNC4yLDguM2MyOS4zLDQyLjcsNDMuMSw3Ny4zLDQzLjQsOTcuMmMtMy4xLDMuNy01LjIsOC4yLTYuMiwxMy4xTDIxNSw0NTAuM2MtMi45LTQtNi44LTcuMi0xMS4xLTkuMmMwLTAuMSwwLTAuMS0wLjEtMC4xYy0yLjktMS41LTctMi4xLTEyLjYtMi4xYy01LjcsMC04LjYsMS04LjYsMUw3MS4zLDMxOS42YzI1LjQsNi41LDU4LjQsOC4xLDk1LDUuOWMxLjUtOC4yLDMuMS0xNi42LDUtMjUuMmMtNDYuMywzLjMtODIuMS0wLjMtMTAzLjEtNy41Yy0xLjYtNC41LTQuNC04LjQtNy43LTExLjVsNTAuNi0xNjBjMC44LTAuMSwxLjUtMC4yLDIuMi0wLjRsMS41LTAuM2MzLjItMC43LDYuMS0xLjksOC43LTMuNWMzMy42LDguMiw5NC4yLDQ1LjYsMTU4LjQsMTEzLjhjMTAsMTAuNiwxOS4yLDIxLDI3LjcsMzEuMmM4LjktMi42LDE3LjQtNS4zLDI1LjQtOC4xYy0xMC43LTEzLjMtMjIuNC0yNi43LTM1LTQwYy01MS4yLTU0LjQtMTExLjYtMTAxLjMtMTU4LjEtMTE3LjRsMTQ4LjYtMzIuOGwtNC40LTI0LjNsLTE1NC4xLDM0Yy02LjYtOS4yLTE4LjMtMTQtMzAtMTEuNGwtMS41LDAuM2MtMTUuOCwzLjUtMjUuNywxOS4xLTIyLjMsMzQuOGwwLjMsMS41YzEuNCw2LjIsNC42LDExLjUsOSwxNS40TDM2LjgsMjc0LjJjLTAuNywwLjEtMS41LDAuMi0yLjEsMC40bC0xLjUsMC4zQzE3LjQsMjc4LjQsNy41LDI5NCwxMSwzMDkuOGwwLjMsMS41YzMuNSwxNS44LDE5LjEsMjUuNywzNC44LDIyLjNsMS41LTAuNGMwLjctMC4xLDEuNS0wLjQsMi4xLTAuNkwxNjMsNDU2LjNjLTIuMyw1LjQtMywxMS41LTEuNiwxNy43bDAuMywxLjVjMy41LDE1LjgsMTkuMSwyNS43LDM0LjgsMjIuM2wxLjUtMC4zYzExLjctMi41LDIwLjItMTEuOSwyMi40LTIyLjlMMzg0LDQzOC40YzYuNyw5LjIsMTguMywxNCwzMCwxMS40bDEuNS0wLjNjMTUuOC0zLjUsMjUuNy0xOS4xLDIyLjMtMzQuOEw0MzcuNCw0MTMuM3oiLz48L2c+PC9nPjwvc3ZnPg==';
  }

  formatParams(): string {
    let params = [];
    const vendorField = encodeURIComponent(this.fullyDecodeURI(this.vendorField));

    if (this.amount) params.push(`amount=${this.amount}`);
    if (this.label) params.push(`label=${this.label}`);
    if (this.vendorField) params.push(`vendorField=${vendorField}`);

    const stringify = params.length > 0 ? `?${params.join("&")}` : '';

    return stringify;
  }

  fullyDecodeURI(uri) {
    const isEncoded = (str) => str !== decodeURIComponent(str);

    while (isEncoded(uri)) uri = decodeURIComponent(uri);

    return uri;
  }

  componentDidUpdate() {
    const scheme = this.generateSchema();
    return this.generateQRCode(scheme);
  }

  componentDidLoad() {
    if (this.amount || this.vendorField || this.label || this.address) {
      this.validateAddress();
      this.validateAmount();
      this.validateVendorField();
      this.validateSize();
      this.validateShowLogo();

      this.isLoad = true;
    }
  }

  render() {
    return (
      <div>
        <canvas></canvas>
      </div>
    );
  }
}
