#!/usr/bin/env node
/**
 * Import MySQL dump into Supabase PostgreSQL
 * Parses INSERT statements and converts to PostgreSQL-compatible inserts
 */

import { readFileSync } from 'fs';
import pg from 'pg';

const CONNECTION_STRING = 'postgresql://postgres.ejwqvahlnmysxeerqrrv:debnuw-gixwur-bypmU0@aws-1-eu-north-1.pooler.supabase.com:5432/postgres';

// Tables to import in dependency order
const TABLES_TO_IMPORT = [
  'schools',
  'school_years',
  'cycles',
  'levels',
  'classroom_types',
  'classrooms',
  'type_families',
  'families',
  'type_students',
  'students',
  'type_paiements',
  'classroom_school_fees',
  'classroom_school_fees_by_parts',
  'student_school_year_loggings',
  'paiements',
  'student_paiement_by_parts',
];

function parseMySQLInserts(sql, tableName) {
  const rows = [];
  // Match INSERT INTO `tableName` VALUES (...)
  const insertRegex = new RegExp(
    `INSERT INTO \`${tableName}\`\\s+VALUES\\s*(.+?);\n`,
    'gs'
  );

  let match;
  while ((match = insertRegex.exec(sql)) !== null) {
    const valuesBlock = match[1];
    // Parse individual row tuples
    const rowTuples = parseRowTuples(valuesBlock);
    rows.push(...rowTuples);
  }

  return rows;
}

function parseRowTuples(valuesBlock) {
  const rows = [];
  let i = 0;
  const len = valuesBlock.length;

  while (i < len) {
    // Find start of tuple
    while (i < len && valuesBlock[i] !== '(') i++;
    if (i >= len) break;
    i++; // skip (

    const values = [];
    let current = '';
    let inString = false;
    let stringChar = '';
    let depth = 1;

    while (i < len && depth > 0) {
      const ch = valuesBlock[i];

      if (inString) {
        if (ch === '\\' && i + 1 < len) {
          current += ch + valuesBlock[i + 1];
          i += 2;
          continue;
        }
        if (ch === stringChar) {
          inString = false;
          current += ch;
        } else {
          current += ch;
        }
      } else {
        if (ch === '\'' || ch === '"') {
          inString = true;
          stringChar = ch;
          current += ch;
        } else if (ch === '(') {
          depth++;
          current += ch;
        } else if (ch === ')') {
          depth--;
          if (depth === 0) {
            values.push(current.trim());
            break;
          }
          current += ch;
        } else if (ch === ',' && depth === 1) {
          values.push(current.trim());
          current = '';
        } else {
          current += ch;
        }
      }
      i++;
    }
    i++; // skip )

    if (values.length > 0) {
      rows.push(values.map(cleanValue));
    }
  }

  return rows;
}

function cleanValue(val) {
  if (val === 'NULL' || val === 'null') return null;
  // Remove surrounding quotes
  if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
    val = val.slice(1, -1);
    // Unescape MySQL escapes
    val = val.replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, '\\').replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\0/g, '');
  }
  return val;
}

// Column mappings for each table (MySQL column order from the dump)
const COLUMN_MAPS = {
  schools: ['id', 'name', 'email', 'phone', 'bp', 'adress', 'slogan', 'logo_id', 'created_by', 'created_at', 'updated_at', 'deleted_at', 'cinet_pay_api_key', 'cinet_pay_site_id'],
  school_years: ['id', 'name', 'date_start', 'date_end', 'created_by', 'created_at', 'updated_at', 'deleted_at', 'school_id', 'school_year_id'],
  cycles: ['id', 'name', 'created_at', 'updated_at', 'deleted_at', 'order_by', 'school_id'],
  levels: ['id', 'name', 'created_at', 'updated_at', 'deleted_at', 'cycle_id', 'order_by', 'school_id'],
  classroom_types: ['id', 'name', 'order_by', 'created_at', 'updated_at', 'deleted_at'],
  classrooms: ['id', 'name', 'created_by', 'created_at', 'updated_at', 'deleted_at', 'level_id', 'school_id', 'school_year_id', 'order_by', 'type_id'],
  type_families: ['id', 'name', 'created_at', 'updated_at', 'deleted_at', 'order_by'],
  families: ['id', 'code', 'firstname', 'lastname', 'address', 'email', 'job', 'phone', 'residence', 'level', 'created_by', 'created_at', 'updated_at', 'deleted_at', 'school_id', 'type_id'],
  type_students: ['id', 'name', 'created_by', 'created_at', 'updated_at', 'deleted_at', 'school_id'],
  students: ['id', 'matricule', 'firstname', 'lastname', 'date_of_birth', 'place_of_birth', 'sex', 'nationality', 'email', 'birth_certificate_number', 'created_at', 'updated_at', 'deleted_at', 'school_id', 'father_id', 'mother_id', 'tutor_id', 'type_id', 'is_registration', 'profil_id'],
  type_paiements: ['id', 'name', 'created_at', 'updated_at', 'deleted_at', 'order_by'],
  classroom_school_fees: ['id', 'name', 'registration_fees', 'additionnal_fees', 'school_fees', 'school_fees_discount', 'school_fees_net', 'total_paiement_part', 'created_by', 'created_at', 'updated_at', 'deleted_at', 'classroom_id', 'school_id', 'school_year_id', 'type_student_id'],
  classroom_school_fees_by_parts: ['id', 'name', 'amount', 'due_date', 'order', 'created_at', 'updated_at', 'deleted_at', 'school_fees_id', 'type_id'],
  student_school_year_loggings: ['id', 'is_first_register', 'repeating', 'paiement_status', 'eps', 'discount', 'school_fees_total', 'school_fees_paid', 'registration_fees_pay', 'additionnal_fees_pay', 'school_fees_pay', 'created_at', 'updated_at', 'deleted_at', 'classroom_id', 'type_student_id', 'school_fees_id', 'lv2_id', 'secondary_subject_id', 'school_year_id', 'student_id', 'school_id', 'created_by', 'profil_id', 'is_not_register', 'solde_register', 'registration_date', 'is_transfer', 'remaining_balance_transfer', 'permonth_amount_tobe_received', 'permonth_amount_received', 'permonth_amount_due_date'],
  paiements: ['id', 'amount', 'created_by', 'created_at', 'updated_at', 'deleted_at', 'school_id', 'student_school_year_logging_id', 'is_discount', 'paiement_type'],
  student_paiement_by_parts: ['id', 'pay_state', 'amount', 'created_at', 'updated_at', 'deleted_at', 'part_id', 'paiement_id', 'student_school_year_logging_id', 'is_discount'],
};

async function main() {
  console.log('Reading MySQL dump...');
  const sql = readFileSync('/Users/rodrigue/Documents/GitHub/LAMBANO/edukea-v2/20260301_edukeaapi_backup.sql', 'utf-8');

  const client = new pg.Client({ connectionString: CONNECTION_STRING });
  await client.connect();
  console.log('Connected to Supabase PostgreSQL');

  // Disable FK checks temporarily
  await client.query('SET session_replication_role = replica;');

  for (const table of TABLES_TO_IMPORT) {
    console.log(`\nProcessing table: ${table}`);
    const rows = parseMySQLInserts(sql, table);
    console.log(`  Found ${rows.length} rows`);

    if (rows.length === 0) continue;

    const columns = COLUMN_MAPS[table];
    if (!columns) {
      console.log(`  SKIPPED: No column mapping defined`);
      continue;
    }

    // Insert in batches of 500
    const batchSize = 500;
    let inserted = 0;

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);

      // Build parameterized insert
      const valuePlaceholders = [];
      const params = [];
      let paramIndex = 1;

      for (const row of batch) {
        const rowPlaceholders = [];
        for (let j = 0; j < columns.length; j++) {
          const val = j < row.length ? row[j] : null;
          rowPlaceholders.push(`$${paramIndex}`);
          params.push(val === '' ? null : val);
          paramIndex++;
        }
        valuePlaceholders.push(`(${rowPlaceholders.join(', ')})`);
      }

      const quotedCols = columns.map(c => c === 'order' ? `"order"` : c).join(', ');
      const query = `INSERT INTO ${table} (${quotedCols}) VALUES ${valuePlaceholders.join(', ')} ON CONFLICT (id) DO NOTHING`;

      try {
        await client.query(query, params);
        inserted += batch.length;
      } catch (err) {
        console.error(`  ERROR inserting batch at row ${i}: ${err.message}`);
        // Try one by one
        for (const row of batch) {
          const rowPlaceholders = columns.map((_, idx) => `$${idx + 1}`);
          const rowParams = columns.map((_, j) => {
            const val = j < row.length ? row[j] : null;
            return val === '' ? null : val;
          });
          const singleQuery = `INSERT INTO ${table} (${quotedCols}) VALUES (${rowPlaceholders.join(', ')}) ON CONFLICT (id) DO NOTHING`;
          try {
            await client.query(singleQuery, rowParams);
            inserted++;
          } catch (rowErr) {
            // Skip problematic rows silently
          }
        }
      }
    }
    console.log(`  Inserted ${inserted} rows`);
  }

  // Re-enable FK checks
  await client.query('SET session_replication_role = DEFAULT;');

  // Print summary
  console.log('\n--- Import Summary ---');
  for (const table of TABLES_TO_IMPORT) {
    const result = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
    console.log(`  ${table}: ${result.rows[0].count} rows`);
  }

  await client.end();
  console.log('\nDone!');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
