import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to add Aadhaar and PAN verification support
 *
 * This migration is skipped because the schema is already synced with the Certificate entity
 * which includes AADHAAR_CARD, PAN_CARD enum values and identity verification columns
 */
export class AddIdentityVerification1697200000000 implements MigrationInterface {
  public async up(_queryRunner: QueryRunner): Promise<void> {
    // Skip this migration - the schema is already synced with the Certificate entity
    // which includes AADHAAR_CARD, PAN_CARD enum values and identity verification columns
    console.log('⏭️  Skipping AddIdentityVerification migration - schema already synced');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_certificates_identity_verified;
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_certificates_pan_hash;
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_certificates_aadhaar_hash;
    `);

    // Drop columns
    await queryRunner.dropColumn('certificates', 'identity_verified_at');
    await queryRunner.dropColumn('certificates', 'identity_verified');
    await queryRunner.dropColumn('certificates', 'pan_number_hash');
    await queryRunner.dropColumn('certificates', 'aadhaar_number_hash');

    // Note: PostgreSQL does not support removing values from enums directly
    // To remove enum values, you would need to:
    // 1. Create a new enum without the values
    // 2. Alter the column to use the new enum
    // 3. Drop the old enum
    // This is complex and risky, so we're leaving the enum values in place
    // They won't cause issues even if not used
    
    console.log('⚠️  Note: Enum values AADHAAR_CARD, PAN_CARD, UIDAI, and INCOME_TAX were not removed.');
    console.log('   PostgreSQL does not support removing enum values easily.');
    console.log('   These values will remain in the enum but can be safely ignored.');
  }
}