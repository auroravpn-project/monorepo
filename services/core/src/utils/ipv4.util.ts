export function ipToInt(ip: string): number {
  return ip
    .split('.')
    .map(Number)
    .reduce((result, current) => (result << 8) + current)
}

export function intToIp(num: number): string {
  return [
    (num >>> 24) & 255,
    (num >>> 16) & 255,
    (num >>> 8) & 255,
    num & 255
  ].join('.')
}

export function generate(cidr: string): string[] {
  const [networkIp, maskStr] = cidr.split('/')
  const mask = Number(maskStr)

  const network = ipToInt(networkIp)
  const hostBits = 32 - mask
  const total = 1 << hostBits

  const result: string[] = []

  for (let i = 1; i < total - 1; i++) {
    result.push(intToIp(network + i))
  }

  return result
}
