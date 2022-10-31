'use client';

/* eslint-disable no-underscore-dangle */
import React from 'react';
import classnames from 'classnames';

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
export const useReport = (instanceId, propsArg, vars, variants, ref) => {
  const props = { ...propsArg };
  const dataD = props['data-d'];

  if (ref) {
    props.ref = ref;
  }

  delete props['data-d'];

  // Check if we're redering on server side
  if (!React.useRef) {
    const getKey = React.useCallback(
      (_, childId, customKey) =>
        [calculateScope(dataD), childId, customKey].join('#'),
      [dataD],
    );

    // server side component
    return [{}, getKey, props];
  }

  // calculate owner scope id
  const ownerScopeIdRef = React.useRef(null);

  if (!ownerScopeIdRef.current) {
    ownerScopeIdRef.current = calculateScope(dataD) || String(instanceCounter);
    instanceCounter += 1;
  }

  // own report (master instance)
  const report = {
    instanceId,
    propertyName: 'COMPOSITION',
    props,
    vars,
    variants,
  };

  if (INSPECTOR?.report) {
    INSPECTOR.report(
      [ownerScopeIdRef.current, instanceId, 'none'].join('#'),
      report,
    );
  }

  // drop reports logic
  React.useEffect(() => {
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
  const getKey = React.useCallback(
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
  newVariablesName,
  newVars,
) => {
  let vars = parentReport.vars;

  if (newVars?.length) {
    vars = { ...parentReport.vars, [newVariablesName]: newVars[0] };

    // in case the render props pass multiple arguments
    // we include a new namespace with the full vars list
    if (newVars.length > 1) {
      vars[`${newVariablesName}Args`] = newVars;
    }
  }

  const report = {
    instanceId,
    propertyName,
    vars,
    parentReport,
  };

  return [report, vars];
};
