// 随机卡通头像工具函数

// 男性卡通头像URL列表（使用DiceBear API）
const maleAvatars = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=',
  'https://api.dicebear.com/7.x/big-smile/svg?seed=',
  'https://api.dicebear.com/7.x/bottts/svg?seed=',
  'https://api.dicebear.com/7.x/fun-emoji/svg?seed=',
  'https://api.dicebear.com/7.x/icons/svg?seed=',
  'https://api.dicebear.com/7.x/identicon/svg?seed=',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=',
  'https://api.dicebear.com/7.x/micah/svg?seed=',
  'https://api.dicebear.com/7.x/miniavs/svg?seed=',
  'https://api.dicebear.com/7.x/open-peeps/svg?seed=',
  'https://api.dicebear.com/7.x/personas/svg?seed=',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=',
  'https://api.dicebear.com/7.x/shapes/svg?seed=',
  'https://api.dicebear.com/7.x/thumbs/svg?seed='
]

// 女性卡通头像URL列表
const femaleAvatars = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=',
  'https://api.dicebear.com/7.x/big-smile/svg?seed=',
  'https://api.dicebear.com/7.x/bottts/svg?seed=',
  'https://api.dicebear.com/7.x/fun-emoji/svg?seed=',
  'https://api.dicebear.com/7.x/icons/svg?seed=',
  'https://api.dicebear.com/7.x/identicon/svg?seed=',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=',
  'https://api.dicebear.com/7.x/micah/svg?seed=',
  'https://api.dicebear.com/7.x/miniavs/svg?seed=',
  'https://api.dicebear.com/7.x/open-peeps/svg?seed=',
  'https://api.dicebear.com/7.x/personas/svg?seed=',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=',
  'https://api.dicebear.com/7.x/shapes/svg?seed=',
  'https://api.dicebear.com/7.x/thumbs/svg?seed='
]

// 默认头像（当性别未知时）
const defaultAvatars = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=',
  'https://api.dicebear.com/7.x/big-smile/svg?seed=',
  'https://api.dicebear.com/7.x/bottts/svg?seed=',
  'https://api.dicebear.com/7.x/fun-emoji/svg?seed=',
  'https://api.dicebear.com/7.x/icons/svg?seed=',
  'https://api.dicebear.com/7.x/identicon/svg?seed=',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=',
  'https://api.dicebear.com/7.x/micah/svg?seed=',
  'https://api.dicebear.com/7.x/miniavs/svg?seed=',
  'https://api.dicebear.com/7.x/open-peeps/svg?seed=',
  'https://api.dicebear.com/7.x/personas/svg?seed=',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=',
  'https://api.dicebear.com/7.x/shapes/svg?seed=',
  'https://api.dicebear.com/7.x/thumbs/svg?seed='
]

/**
 * 根据选手姓名和性别生成随机卡通头像
 * @param {String} name - 选手姓名
 * @param {String} gender - 性别 ('male', 'female', 'other' 或 undefined)
 * @returns {String} 头像URL
 */
export function getRandomAvatar(name, gender) {
  // 使用姓名作为种子，确保同一选手总是得到相同的头像
  const seed = name || 'default'
  
  // 根据性别选择头像库
  let avatarList
  if (gender === 'male') {
    avatarList = maleAvatars
  } else if (gender === 'female') {
    avatarList = femaleAvatars
  } else {
    avatarList = defaultAvatars
  }
  
  // 根据姓名生成一个稳定的索引
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i)
    hash = hash & hash // Convert to 32bit integer
  }
  const index = Math.abs(hash) % avatarList.length
  
  // 返回头像URL，使用seed参数确保一致性
  const baseUrl = avatarList[index]
  return `${baseUrl}${seed}`
}

/**
 * 获取选手头像（带缓存）
 */
const avatarCache = new Map()

export function getPlayerAvatar(name, gender) {
  const cacheKey = `${name}_${gender || 'unknown'}`
  
  if (avatarCache.has(cacheKey)) {
    return avatarCache.get(cacheKey)
  }
  
  const avatar = getRandomAvatar(name, gender)
  avatarCache.set(cacheKey, avatar)
  return avatar
}

