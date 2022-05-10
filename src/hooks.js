/* eslint-disable no-underscore-dangle */
import { useRef, useEffect, useCallback } from 'react';

let instanceCounter = 0;

let inspector;

if (typeof window !== 'undefined' && window.__CLUTCH_INSPECTOR__) {
  inspector = window.__CLUTCH_INSPECTOR__;
}

const deserializeDebugKey = (debugKey) =>
  String(debugKey)
    .match(/(.+?)#(.+?)#(.*)/)
    ?.slice(1) || [];
const calculateScope = (debugKey) => {
  const [previousScope, rootInstanceId] = deserializeDebugKey(debugKey);

  return previousScope && previousScope !== '0'
    ? `${previousScope}.${rootInstanceId}`
    : rootInstanceId;
};

// eslint-disable-next-line import/prefer-default-export
export const useReport = (report) => {
  const ownerScopeIdRef = useRef(null);

  if (!ownerScopeIdRef.current) {
    ownerScopeIdRef.current =
      calculateScope(report?.attributes?.['data-d']) || String(instanceCounter);
    instanceCounter += 1;
  }

  useEffect(() => {
    if (inspector?.cancelDropReports && ownerScopeIdRef.current) {
      inspector.cancelDropReports(ownerScopeIdRef.current);
    }

    return () => {
      if (inspector?.dropReports && ownerScopeIdRef.current) {
        inspector.dropReports(ownerScopeIdRef.current);
      }
    };
  }, [report?.attributes?.['data-d']]);

  const getKey = useCallback(
    (childReport, childId, customKey) => {
      const key = [ownerScopeIdRef.current, childId, customKey].join('#');

      if (inspector?.report) {
        inspector.report(key, childReport);
      }

      return key;
    },
    [ownerScopeIdRef.current],
  );

  return [report, getKey];
};
