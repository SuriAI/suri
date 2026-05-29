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


def run_migrations():
    """Run alembic upgrade head programmatically."""
    # First, verify database integrity and perform self-healing if corrupted
    verify_and_repair_database()

    logger.info("Checking for database migrations in %s...", DATA_DIR / "attendance.db")

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

    try:
        command.upgrade(alembic_cfg, "head")
        logger.info("Database migration check complete (head).")
    except Exception:
        logger.exception("Failed to run database migrations.")
        raise
