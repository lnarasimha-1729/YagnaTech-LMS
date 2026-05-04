/**
 * EditPhraseSettings - Edit translated phrases for a language.
 *
 * ============================================================================
 * ORIGINAL BLADE: resources/views/admin/setting/edit_phrase.blade.php
 * ============================================================================
 */

import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useApi } from '@/hooks/useApi';
import { useSettings } from '@/contexts/SettingsContext';

export default function EditPhraseSettings() {
  const { langId } = useParams();
  const { translate } = useSettings();
  const { get, post } = useApi();

  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState(null);
  const [phrases, setPhrases] = useState([]);
  const [edits, setEdits] = useState({});
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get(`/api/admin/languages/${langId}/phrases`);
      const data = res.data || res;
      setLanguage(data.language || null);
      setPhrases(data.phrases || data || []);
    } catch {
      toast.error(translate('Failed to load phrases'));
    } finally {
      setLoading(false);
    }
  }, [get, langId, translate]);

  useEffect(() => { load(); }, [load]);

  const updatePhrase = async (phraseId) => {
    const translated = edits[phraseId];
    if (translated === undefined) return;
    try {
      await post(`/api/admin/languages/phrases/${phraseId}`, {
        translated_phrase: translated,
      });
      toast.success(translate('Phrase updated'));
    } catch {
      toast.error(translate('Failed to update'));
    }
  };

  const importPhrases = async () => {
    try {
      await post(`/api/admin/languages/${langId}/import-phrases`);
      toast.success(translate('Phrases imported'));
      load();
    } catch {
      toast.error(translate('Failed to import'));
    }
  };

  const filtered = search
    ? phrases.filter(
        (p) =>
          (p.phrase || '').toLowerCase().includes(search.toLowerCase()) ||
          (p.translated || '').toLowerCase().includes(search.toLowerCase()),
      )
    : phrases;

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <div className="bg-white border border-gray-100 rounded-lg">
        <div className="py-3 px-5 my-3">
          <div className="flex items-center justify-between  flex-wrap gap-3">
            <h4 className="title text-base">
              <i className="fi-rr-settings-sliders mr-2" />
              {translate('Edit phrases')} — {language?.name || ''}
            </h4>
            <div className="flex gap-2">
              <button
                className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center cg-10px"
                type="button"
                onClick={importPhrases}
              >
                <span className="fi-rr-cloud-upload" />
                <span>{translate('Import all phrases from english')}</span>
              </button>
              <Link
                className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center cg-10px"
                to="/admin/settings/language"
              >
                <span className="fi-rr-arrow-alt-left" />
                <span>{translate('Back')}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap mb-3">
        <div className="w-full">
          <div className="p-4 rounded-lg mb-4 bg-emerald-50 text-emerald-700 border border-emerald-100" role="alert">
            {translate('The symbol ___ represents dynamic values that will be replaced dynamically. Do not remove the ___ symbol.')}
          </div>
        </div>
        <div className="w-full md:w-1/3">
          <input
            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            type="text"
            placeholder={translate('Search phrases...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap">
        {filtered.map((p) => (
          <div key={p.id} className="w-full md:w-1/3 mb-3">
            <div className="bg-white border border-gray-100 rounded-lg p-4">
              <div className="">
                <label className="block text-sm font-medium text-gray-700 mb-1.5 mb-1">{p.phrase}</label>
                <input
                  className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  type="text"
                  value={edits[p.id] !== undefined ? edits[p.id] : p.translated || ''}
                  onChange={(e) =>
                    setEdits((prev) => ({ ...prev, [p.id]: e.target.value }))
                  }
                />
                <button
                  className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-emerald-600 text-white hover:bg-emerald-700 mt-3"
                  type="button"
                  onClick={() => updatePhrase(p.id)}
                >
                  {translate('Update')}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
