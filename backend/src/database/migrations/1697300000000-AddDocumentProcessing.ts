import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class AddDocumentProcessing1697300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create document_processing table
    await queryRunner.createTable(
      new Table({
        name: 'document_processing',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'document_type',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'original_filename',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 's3_key',
            type: 'varchar',
            length: '500',
            isNullable: false,
          },
          {
            name: 's3_bucket',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 's3_url',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'processing_status',
            type: 'varchar',
            length: '50',
            isNullable: false,
            default: "'pending'",
          },
          {
            name: 'ocr_text',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'ocr_confidence',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'extracted_fields',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'extraction_confidence',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'validation_errors',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'overall_confidence',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'processing_time_ms',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'error_message',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'corrected_fields',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'correction_notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'is_verified',
            type: 'boolean',
            default: false,
          },
          {
            name: 'verified_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'verified_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // Create foreign key for user_id
    await queryRunner.createForeignKey(
      'document_processing',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      })
    );

    // Create foreign key for verified_by
    await queryRunner.createForeignKey(
      'document_processing',
      new TableForeignKey({
        columnNames: ['verified_by'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      })
    );

    // Create indexes
    await queryRunner.query(
      `CREATE INDEX idx_document_processing_user_id ON document_processing(user_id)`
    );
    await queryRunner.query(
      `CREATE INDEX idx_document_processing_document_type ON document_processing(document_type)`
    );
    await queryRunner.query(
      `CREATE INDEX idx_document_processing_status ON document_processing(processing_status)`
    );
    await queryRunner.query(
      `CREATE INDEX idx_document_processing_created_at ON document_processing(created_at)`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS idx_document_processing_created_at`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_document_processing_status`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_document_processing_document_type`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_document_processing_user_id`);

    // Drop foreign keys
    const table = await queryRunner.getTable('document_processing');
    if (table) {
      const userForeignKey = table.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('user_id') !== -1
      );
      if (userForeignKey) {
        await queryRunner.dropForeignKey('document_processing', userForeignKey);
      }

      const verifiedByForeignKey = table.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('verified_by') !== -1
      );
      if (verifiedByForeignKey) {
        await queryRunner.dropForeignKey('document_processing', verifiedByForeignKey);
      }
    }

    // Drop table
    await queryRunner.dropTable('document_processing');
  }
}