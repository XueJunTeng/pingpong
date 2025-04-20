// src/types/auth.ts

// 用户注册请求数据类型
// @field email - 用户邮箱（需符合RFC 5322标准）
// @field username - 用户名（2-20位字母数字下划线）
// @field password - 密码（8-20位，需包含大小写和数字）
export interface RegisterData {
  email: string;
  username: string;
  password: string;
}

// 用户登录请求数据类型
// @field username - 用户名或注册邮箱
// @field password - 登录密码
export interface LoginData {
  username: string;
  password: string;
}

// 认证响应数据结构
// @field token - JWT认证令牌（有效期2小时）
// @field userId - 系统唯一用户标识
// @field username - 显示用用户名
// @field role - 用户权限角色
// @field avatarUrl - 头像绝对URL地址（可选）
// @field email - 已验证的注册邮箱
export interface AuthResponse {
  token: string;
  userId: number;
  username: string;
  role: UserRole;
  avatarUrl: string;
  email: string;
}

// 用户账户状态类型
// @value active - 正常状态
// @value disabled - 停用状态（无法登录）
export type UserStatus = 'active' | 'disabled';

// 系统角色类型（按权限升序排列）
// @value USER - 普通用户（基础权限）
// @value ADMIN - 管理员（系统管理权限）
export type UserRole = 'USER' | 'ADMIN';

// 完整用户档案类型（用于管理界面）
// @field userId - 系统唯一标识
// @field username - 唯一用户名（不可重复）
// @field email - 已验证邮箱
// @field role - 当前权限角色
// @field status - 账户状态
// @field avatarUrl - 头像URL（允许空值）
// @field registrationTime - 注册时间（UTC时间戳）
// @field lastLoginTime - 最后登录时间（UTC时间戳，可选）
// @field _originalRole - 临时保存原始角色（用于撤销操作）
export interface UserProfile {
  // 核心信息
  userId: number;
  username: string;
  email: string;

  // 权限相关
  role: UserRole;
  status: UserStatus;

  // 可选信息
  avatarUrl?: string | null;
  registrationTime: Date;
  lastLoginTime?: Date;

  // 管理用临时字段
  _originalRole?: UserRole;  // 用于角色修改撤销
}

// 用户档案更新请求类型
// @field username - 新用户名（可选）
// @field avatarUrl - 新头像URL（传null表示删除）
export interface ProfileUpdateData {
  username?: string;
  avatarUrl?: string | null;
}

// 密码修改请求类型
// @field oldPassword - 原密码（需验证）
// @field newPassword - 新密码（符合复杂度要求）
export interface PasswordChangeData {
  oldPassword: string;
  newPassword: string;
}
// 用户档案更新请求类型（用于PATCH请求）
// @field username - 新用户名（2-20位字符，可选）
// @field avatarUrl - 新头像URL（传空字符串表示删除头像，可选）
// @field email - 新（需重新验证，可选）
// @field status - 账户状态（仅管理员可修改）
export interface UserProfileUpdate {
  username?: string;
  avatarUrl?: string | null;
  email?: string;
  status?: UserStatus;  // 需要管理员权限
}