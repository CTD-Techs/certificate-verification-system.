import { AppDataSource } from '../../config/database';
import { User, UserRole } from '../../models';
import { hashPassword, comparePassword } from '../../utils/crypto';
import { UnauthorizedError, ConflictError, NotFoundError } from '../../utils/error';
import { generateAccessToken, generateRefreshToken } from './jwt.service';

export interface RegisterDto {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: UserRole;
    createdAt: Date;
  };
  token: string;
  refreshToken?: string;
}

class AuthService {
  private userRepository = AppDataSource.getRepository(User);

  /**
   * Register a new user
   */
  async register(data: RegisterDto): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: data.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Create user
    const user = this.userRepository.create({
      email: data.email.toLowerCase(),
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role || UserRole.API_USER,
      isActive: true,
    });

    await this.userRepository.save(user);

    // Generate tokens
    const token = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        createdAt: user.createdAt,
      },
      token,
      refreshToken,
    };
  }

  /**
   * Login user
   */
  async login(data: LoginDto): Promise<AuthResponse> {
    // Find user
    const user = await this.userRepository.findOne({
      where: { email: data.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedError('Account is disabled');
    }

    // Verify password
    const isPasswordValid = await comparePassword(data.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Update last login
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    // Generate tokens
    const token = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        createdAt: user.createdAt,
      },
      token,
      refreshToken,
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    data: { firstName?: string; lastName?: string }
  ): Promise<User> {
    const user = await this.getUserById(userId);

    if (data.firstName !== undefined) {
      user.firstName = data.firstName;
    }
    if (data.lastName !== undefined) {
      user.lastName = data.lastName;
    }

    await this.userRepository.save(user);
    return user;
  }

  /**
   * Change user password
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await this.getUserById(userId);

    // Verify current password
    const isPasswordValid = await comparePassword(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    // Hash new password
    user.passwordHash = await hashPassword(newPassword);
    await this.userRepository.save(user);
  }
}

export default new AuthService();