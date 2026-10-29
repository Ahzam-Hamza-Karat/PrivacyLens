import React, { useState, useRef } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import PolicyAnalyzer from './components/PolicyAnalyzer';
import ReportPreview from './components/ReportPreview';
import SavedAnalysesSection from './components/SavedAnalysesSection';
import CookieCenter from './components/CookieCenter';
import PolicyChatbot from './components/PolicyChatbot';
import PolicyComparison from './components/PolicyComparison';
import HowItWorks from './components/HowItWorks';
import DiagnosticCard from './components/DiagnosticCard';
import Footer from './components/Footer';
import { SAMPLE_POLICY } from './utils/constants';
import { analyzePolicy } from './services/api';

/**
 * Main PrivacyLens Application
 * Assembles navigation, hero, trust banner, policy analyzer workspace,
 * live analysis findings report, chat placeholder, methodology breakdown, API diagnostics, and footer.
 */
export function App() {
  const [policyText, setPolicyText] = useState('');
  const [analysisReport, setAnalysisReport] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const [isStaleReport, setIsStaleReport] = useState(false);
  const [refreshSavedTrigger, setRefreshSavedTrigger] = useState(0);

  const analyzerTextareaRef = useRef(null);

  const handleStartAnalyzing = () => {
    const analyzerElem = document.getElementById('analyzer');
    if (analyzerElem) {
      analyzerElem.scrollIntoView({ behavior: 'smooth' });
    }
    if (analyzerTextareaRef.current) {
      analyzerTextareaRef.current.focus();
    }
  };

  const handleTextChange = (newText) => {
    setPolicyText(newText);
    // If a report is currently displayed, mark it as stale since text has changed
    if (analysisReport) {
      setIsStaleReport(true);
    }
  };

  const handleLoadSample = () => {
    setPolicyText(SAMPLE_POLICY);
    if (analysisReport) {
      setIsStaleReport(true);
    }
    const analyzerElem = document.getElementById('analyzer');
    if (analyzerElem) {
      analyzerElem.scrollIntoView({ behavior: 'smooth' });
    }
    if (analyzerTextareaRef.current) {
      analyzerTextareaRef.current.focus();
    }
  };

  const handleClearText = () => {
    setPolicyText('');
    setAnalysisReport(null);
    setAnalysisError(null);
    setIsStaleReport(false);
    if (analyzerTextareaRef.current) {
      analyzerTextareaRef.current.focus();
    }
  };

  const handleLoadSavedReport = (loadedReport) => {
    setAnalysisReport(loadedReport);
    setIsStaleReport(false);
    setAnalysisError(null);
    const previewElem = document.getElementById('preview');
    if (previewElem) {
      previewElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSaveSuccess = () => {
    setRefreshSavedTrigger((prev) => prev + 1);
  };

  const handleAnalyzePolicy = async (textToAnalyze) => {
    setIsAnalyzing(true);
    setAnalysisError(null);

    const result = await analyzePolicy(textToAnalyze || policyText);

    setIsAnalyzing(false);

    if (result.success) {
      setAnalysisReport(result.data);
      setIsStaleReport(false);
      setAnalysisError(null);

      // Smooth scroll to findings section
      const previewElem = document.getElementById('preview');
      if (previewElem) {
        previewElem.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      setAnalysisError(result.error);
    }
  };

  return (
    <>
      <Navbar onNavigateToAnalyzer={handleStartAnalyzing} />

      <main id="main-content">
        <Hero
          onStartAnalyzing={handleStartAnalyzing}
          onLoadSample={handleLoadSample}
        />

        <PolicyAnalyzer
          ref={analyzerTextareaRef}
          policyText={policyText}
          onTextChange={handleTextChange}
          onLoadSample={handleLoadSample}
          onClearText={handleClearText}
          onAnalyze={handleAnalyzePolicy}
          isAnalyzing={isAnalyzing}
          analysisError={analysisError}
        />

        <ReportPreview
          analysisReport={analysisReport}
          policyText={policyText}
          isStale={isStaleReport}
          onReanalyze={() => handleAnalyzePolicy(policyText)}
          onSaveSuccess={handleSaveSuccess}
        />

        <SavedAnalysesSection
          onLoadSavedReport={handleLoadSavedReport}
          refreshTrigger={refreshSavedTrigger}
        />

        <CookieCenter
          analysisReport={analysisReport}
          policyText={policyText}
          isStale={isStaleReport}
          onReanalyze={() => handleAnalyzePolicy(policyText)}
        />

        <PolicyChatbot
          policyText={policyText}
          analysisReport={analysisReport}
          isStale={isStaleReport}
        />

        <PolicyComparison />

        <HowItWorks />

        <DiagnosticCard />
      </main>

      <Footer />
    </>
  );
}

export default App;
