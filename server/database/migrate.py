import logging
import sqlite3
import time
from alembic.config import Config
from alembic import command
from alembic.script import ScriptDirectory

from config.paths import ALEMBIC_CONFIG_PATH, DATA_DIR, MIGRATIONS_DIR

logger = logging.getLogger(__name__)


def verify_and_repair_database():
    """Verify database integrity. If corrupted, archive the malformed database file
    to trigger a fresh database creation and subsequent synchronization.
    """
    db_path = DATA_DIR / "attendance.db"
    if not db_path.exists():
        return

    logger.info("Checking database integrity for %s...", db_path)
    try:
        # Run integrity check synchronously using standard sqlite3
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        cursor.execute(
            "PRAGMA integrity_check(1);"
        )  # Check the first error page for speed
        result = cursor.fetchone()
        conn.close()

        if result and result[0] != "ok":
            raise sqlite3.DatabaseError(f"Integrity check failed: {result[0]}")

        logger.info("Database integrity verified successfully.")
    except (sqlite3.DatabaseError, sqlite3.OperationalError) as e:
        logger.error(
            f"[DB_CORRUPTION] Corrupted database detected! Error: {e}",
            exc_info=True,
        )

        # Archive corrupted database file
        corrupt_backup_path = DATA_DIR / f"attendance.db.corrupt_{int(time.time())}"
        try:
            db_path.rename(corrupt_backup_path)
            logger.warning(
                f"[DB_CORRUPTION] Successfully archived corrupted database to {corrupt_backup_path.name}"
            )
        except Exception as rename_err:
            logger.error(
                f"[DB_CORRUPTION] Failed to archive corrupted database: {rename_err}. Deleting file."
            )
            try:
                db_path.unlink(missing_ok=True)
            except Exception as unlink_err:
                logger.critical(
                    f"[DB_CORRUPTION] Fatal: Unable to remove corrupted database file: {unlink_err}"
                )


def check_and_stamp_baseline(db_path, alembic_cfg):
    """Check the database schema to detect which Alembic migration revision
    it matches, and stamp the database with that revision if the alembic_version
    table is missing or empty. This prevents duplicate table/column creation errors.
    """
    if not db_path.exists():
        return

    try:
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()

        # Check if attendance_groups table exists
        cursor.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='attendance_groups';"
        )
        has_groups_table = cursor.fetchone() is not None

        if not has_groups_table:
            conn.close()
            return

        # Check if alembic_version table exists and has a row
        has_version = False
        try:
            cursor.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name='alembic_version';"
            )
            if cursor.fetchone() is not None:
                cursor.execute("SELECT version_num FROM alembic_version;")
                if cursor.fetchone() is not None:
                    has_version = True
        except sqlite3.OperationalError:
            pass

        if has_version:
            conn.close()
            return

        # Detect the appropriate revision based on schema characteristics
        # Get columns of attendance_groups
        cursor.execute("PRAGMA table_info(attendance_groups);")
        group_cols = [row[1] for row in cursor.fetchall()]

        # Get columns of attendance_records
        cursor.execute("PRAGMA table_info(attendance_records);")
        record_cols = [row[1] for row in cursor.fetchall()]

        # Check if attendance_group_rules table exists
        cursor.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='attendance_group_rules';"
        )
        has_rules_table = cursor.fetchone() is not None

        conn.close()

        target_revision = "9d9c0b4c6a01"  # Default to baseline schema

        if "description" not in group_cols:
            # Column 'description' was dropped in 2c0e0f2c3bf3
            if "biometric_consent_certified" in group_cols:
                target_revision = "e2f3a4b5c6d7"  # Head
            elif "is_voided" in record_cols:
                target_revision = "d1e2f3a4b5c6"
            elif has_rules_table:
                target_revision = (
                    "c9d8e7f6a5b4"  # Merge node for rules and face settings
                )
            else:
                target_revision = "2c0e0f2c3bf3"

        logger.warning(
            f"Database tables detected but no Alembic version found. "
            f"Detected current schema matches revision '{target_revision}'. Stamping..."
        )
        command.stamp(alembic_cfg, target_revision)
        logger.info(f"Database successfully stamped to '{target_revision}'.")

    except Exception as e:
        logger.error("Failed to check or stamp baseline version: %s", e, exc_info=True)


def run_migrations():
    """Run alembic upgrade head programmatically."""
    # First, verify database integrity and perform self-healing if corrupted
    verify_and_repair_database()

    db_path = DATA_DIR / "attendance.db"
    logger.info("Checking for database migrations in %s...", db_path)

    alembic_cfg = Config(str(ALEMBIC_CONFIG_PATH))

    # Ensure script_location points to the correct absolute path.
    # This is critical for frozen environments.
    alembic_cfg.set_main_option("script_location", str(MIGRATIONS_DIR))

    script_dir = ScriptDirectory.from_config(alembic_cfg)
    heads = script_dir.get_heads()
    if len(heads) > 1:
        raise RuntimeError(
            f"Multiple Alembic heads detected: {', '.join(heads)}. "
            "Create a merge revision before starting the backend."
        )

    # Perform self-healing check if migrations are in an inconsistent/partially created state
    check_and_stamp_baseline(db_path, alembic_cfg)

    try:
        command.upgrade(alembic_cfg, "head")
        logger.info("Database migration check complete (head).")
    except Exception:
        logger.exception("Failed to run database migrations.")
        raise
