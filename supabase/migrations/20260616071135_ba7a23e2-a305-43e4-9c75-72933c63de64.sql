
-- Users can upload to their own folder: analysis-files/<uid>/...
CREATE POLICY "analysis_files_insert_own"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'analysis-files'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "analysis_files_select_own"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'analysis-files'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "analysis_files_update_own"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'analysis-files'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "analysis_files_delete_own"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'analysis-files'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
