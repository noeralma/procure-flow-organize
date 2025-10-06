import { connectDatabase, disconnectDatabase } from '../config/database'
import UserModel, { UserRole, UserStatus } from '../models/User'
import { logger } from '../utils/logger'

async function ensureUser(params: {
  username: string
  email: string
  password: string
  firstName: string
  lastName: string
  role: UserRole
}) {
  const existing = await UserModel.findOne({
    $or: [{ email: params.email.toLowerCase() }, { username: params.username }],
  })

  if (existing) {
    // Update role if different (e.g., upgrade to admin)
    if (existing.role !== params.role) {
      existing.role = params.role
      await existing.save()
      logger.info(`Updated role for ${existing.email} to ${params.role}`)
    } else {
      logger.info(`User already exists: ${existing.email} (${existing.role})`)
    }
    return existing
  }

  const user = new UserModel({
    username: params.username,
    email: params.email.toLowerCase(),
    password: params.password,
    firstName: params.firstName,
    lastName: params.lastName,
    role: params.role,
    status: UserStatus.ACTIVE,
  })

  await user.save()
  logger.info(`Created ${params.role} user: ${params.email}`)
  return user
}

async function main() {
  await connectDatabase()

  try {
    // Admin account
    await ensureUser({
      username: 'admin',
      email: 'admin@example.com',
      password: 'Admin123!',
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
    })

    // Regular user account
    await ensureUser({
      username: 'user',
      email: 'user@example.com',
      password: 'User123!',
      firstName: 'Regular',
      lastName: 'User',
      role: UserRole.USER,
    })

    logger.info('✅ Test users ensured successfully')
  } catch (error) {
    logger.error('❌ Failed to create test users:', error)
    process.exitCode = 1
  } finally {
    await disconnectDatabase()
  }
}

if (require.main === module) {
  // Run script directly
  main()
}