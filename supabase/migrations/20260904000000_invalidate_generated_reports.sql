-- 새 로직으로 보고서를 다시 생성하기 위해 기존 생성 콘텐츠를 무효화한다.
BEGIN;

DELETE FROM monthly_reports;
DELETE FROM periodic_reports;

COMMIT;
