/* eslint-disable no-underscore-dangle */
import classnames from 'classnames';
import { useRef, useEffect, useCallback } from 'react';

/**
 * Get the clutch inspector at the current version
 */
const INSPECTOR =
  typeof window !== 'undefined' && window.__CLUTCH_INSPECTOR__?.v1;

/**
 * mClassnames - Merges class names
 *
 * @param {*} valueA
 * @param {<*>} ...oterhValues
 *
 * @returns {*} resulting value
 */
export const cx = classnames;

/**
 * tryCatch - tries to run the passed fn
 *
 * @param {Function} fn
 *
 * @returns {*}
 */
export function tryCatch(fn, ...args) {
  let result;

  try {
    if (typeof fn !== 'function') {
      throw new Error(
        'Code property on an instance is not exporting a function',
      );
    }

    result = fn(...args);
  } catch (err) {
    // eslint-disable-next-line
    console.error(err);
  }

  return result;
}

/**
 * deserializeDebugKey - deserializes a debug key string
 * composed of ${scopeId}#${id}#${customKey}
 *
 * @param {String} debugKey
 *
 * @returns {Array<String>} [scopeId, id, customKey]
 */
const deserializeDebugKey = (debugKey) =>
  String(debugKey)
    .match(/(.+?)#(.+?)#(.*)/)
    ?.slice(1) || [];

/**
 * calculateScope - calculates next scope id based on debugKey
 *
 * @param {String} debugKey
 *
 * @returns {String} new scopeId
 */
const calculateScope = (debugKey) => {
  const [previousScope, rootInstanceId] = deserializeDebugKey(debugKey);

  return previousScope && previousScope !== '0'
    ? `${previousScope}.${rootInstanceId}`
    : rootInstanceId || '0';
};

let instanceCounter = 0;

/**
 * useReport - called at the head of a clutch composed component
 *
 * @param {String} instanceId
 * @param {String} propsArg - component props
 * @param {String} variants - component computed variants state
 * @param {*Object} ref - component ref (optional)
 *
 * @returns {[Object, Function, Object]} [report, getKey, props]
 */
export const useReport = (instanceId, propsArg, variants, ref) => {
  const props = { ...propsArg };
  const dataD = props['data-d'];

  if (ref) {
    props.ref = ref;
  }

  delete props['data-d'];

  // calculate owner scope id
  const ownerScopeIdRef = useRef(null);

  if (!ownerScopeIdRef.current) {
    ownerScopeIdRef.current = calculateScope(dataD) || String(instanceCounter);
    instanceCounter += 1;
  }

  // own report (master instance)
  const report = {
    instanceId,
    propertyName: 'COMPOSITION',
    props,
    variants,
  };

  if (INSPECTOR?.report) {
    INSPECTOR.report(
      [ownerScopeIdRef.current, instanceId, 'none'].join('#'),
      report,
    );
  }

  // drop reports logic
  useEffect(() => {
    if (INSPECTOR?.cancelDropReports && ownerScopeIdRef.current) {
      INSPECTOR.cancelDropReports(ownerScopeIdRef.current);
    }

    return () => {
      if (INSPECTOR?.dropReports && ownerScopeIdRef.current) {
        INSPECTOR.dropReports(ownerScopeIdRef.current);
      }
    };
  }, [dataD]);

  // get key handler for children instances
  const getKey = useCallback(
    (childReport, childId, customKey) => {
      const key = [ownerScopeIdRef.current, childId, customKey].join('#');

      if (INSPECTOR?.report) {
        INSPECTOR.report(key, childReport);
      }

      return key;
    },
    [ownerScopeIdRef.current],
  );

  return [report, getKey, props];
};

/**
 * getReport - generates a report object based on previous report and new data
 *
 * @param {String} instanceId
 * @param {String} propertyName
 * @param {Object} parentReport
 * @param {Object} newVariables
 *
 * @returns {[Object, Object]}
 */
export const getReport = (
  instanceId,
  propertyName,
  parentReport,
  newVariables,
) => {
  const vars = { ...parentReport.vars, ...newVariables };
  const report = {
    instanceId,
    propertyName,
    vars,
    parentReport,
  };

  return [report, vars];
};
