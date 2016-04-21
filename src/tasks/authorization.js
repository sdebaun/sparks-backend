export const isAdmin = profile => profile && profile.isAdmin

export const isEAP = profile => profile && profile.isEAP

export const isUser = (profile, key) => profile && profile.$key === key
