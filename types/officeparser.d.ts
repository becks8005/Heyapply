declare module 'officeparser' {
  export function parseOffice(buffer: Buffer): Promise<string>
  export function parseOfficeAsync(buffer: Buffer, options?: any): Promise<string>
}

