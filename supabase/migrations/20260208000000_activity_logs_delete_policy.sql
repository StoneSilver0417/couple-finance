-- activity_logs DELETE 정책 추가 (기존 잘못된 데이터 정리용)
CREATE POLICY "Users can delete their household activity logs"
ON activity_logs FOR DELETE
USING (
  household_id IN (
    SELECT household_id FROM profiles WHERE id = auth.uid()
  )
);
