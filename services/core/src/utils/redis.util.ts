export function genUserKey(uid?: number) {
  if (uid) {
    return `user:${uid}`
  }
  return 'user:*'
}

export function genPeerKey(publicKey?: string) {
  if (publicKey) {
    return `peer:${publicKey}`
  }
  return 'peer:*'
}

export function genSessionKey(sid?: number) {
  if (sid) {
    return `session:${sid}`
  }
  return 'session:*'
}

export function getUID(key: string) {
  return Number(key.split(':')[1])
}

export function getPublicKey(key: string) {
  return String(key.split(':')[1])
}

export function getSID(key: string) {
  return Number(key.split(':')[1])
}
