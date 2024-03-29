'use client';

/* eslint-disable no-underscore-dangle */
import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import classnames from 'classnames';
import { ChakraProvider } from '@chakra-ui/provider';
import { ColorModeScript, useColorMode } from '@chakra-ui/color-mode';
import { useTheme as useChakraTheme } from '@chakra-ui/system';
import { extendTheme } from '@chakra-ui/theme-utils';

let cachedReports = [];
let interval;

/**
 * Get the clutch inspector at the current version
 */
const getInspector = () =>
  typeof window !== 'undefined' ? window?.__CLUTCH_INSPECTOR__?.v1 : undefined;

/**
 * Sends reports that were cached before the inspector was ready
 */
const sendCachedReports = () => {
  if (!cachedReports.length === 0) {
    return;
  }

  const inspector = getInspector();

  if (inspector) {
    cachedReports.forEach(({ computedKey, report, clutchInternalId }) => {
      inspector.report?.(computedKey, report, clutchInternalId);
    });

    cachedReports = [];
  }

  if (interval) {
    clearInterval(interval);
  }
};

/**
 * Sends a report to the inspector
 */
const sendReport = (computedKey, report, clutchInternalId) => {
  const inspector = getInspector();

  if (inspector) {
    if (cachedReports.length) {
      sendCachedReports();

      if (interval) {
        clearInterval(interval);
      }
    }

    inspector.report?.(computedKey, report, clutchInternalId);
  } else {
    cachedReports.push({
      computedKey,
      report,
      clutchInternalId,
    });

    if (!interval) {
      interval = setInterval(sendCachedReports, 1000);
    }
  }
};

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
    vars,
    variants,
  };

  sendReport([ownerScopeIdRef.current, instanceId, ''].join('#'), report);

  // drop reports logic
  useEffect(() => {
    if (getInspector()?.cancelDropReports && ownerScopeIdRef.current) {
      getInspector().cancelDropReports(ownerScopeIdRef.current);
    }

    return () => {
      if (getInspector()?.dropReports && ownerScopeIdRef.current) {
        getInspector().dropReports(ownerScopeIdRef.current);
      }
    };
  }, [dataD]);

  // get key handler for children instances
  const getKey = useCallback(
    (childReport, childId, customKey, clutchInternalId) => {
      const key = [ownerScopeIdRef.current, childId, customKey].join('#');

      if (getInspector()?.report) {
        sendReport(key, childReport, clutchInternalId);
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
  let { vars } = parentReport || {};

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

/**
 * Color mode component that handles changes to the color mode
 *
 * @param {Object} theme
 * @param {React.Node} children
 */
function ColorMode({ colorMode }) {
  const { colorMode: currentColorMode, toggleColorMode } = useColorMode();

  useMemo(() => {
    if (currentColorMode !== colorMode) {
      toggleColorMode();
    }
  }, [colorMode, currentColorMode]);

  return null;
}

/**
 * Theme component provider
 *
 * @param {Object} theme
 * @param {React.Node} children
 */
export function Theme({ theme = {}, colorMode, children }) {
  const config = {
    ...theme?.config,
    cssVarPrefix: '',
  };

  // force color mode
  if (colorMode) {
    config.initialColorMode = colorMode;
    config.useSystemColorMode = false;
  }

  const finalTheme = extendTheme({ ...theme, config });

  return (
    <ChakraProvider theme={finalTheme}>
      <ColorModeScript
        initialColorMode={finalTheme?.config?.initialColorMode}
      />
      {colorMode ? <ColorMode colorMode={colorMode} /> : null}
      {typeof children === 'function' ? children() : children}
    </ChakraProvider>
  );
}

/**
 * processCssMap - parses chakra theme values into a more digestable object
 *
 * @param {Object} theme
 * @param {React.Node} children
 */
const cachedProcess = {
  map: undefined,
  result: undefined,
};

function processCssMap(cssMap) {
  if (cachedProcess.map === cssMap) {
    return cachedProcess.result;
  }

  const result = {};

  try {
    Object.entries(cssMap || {}).forEach(([key, value]) => {
      const split = key.split('.');
      let curr = result;

      split.forEach((splitPath, index) => {
        if (index !== split.length - 1) {
          curr[splitPath] = curr[splitPath] || {};
          curr = curr[splitPath];
        } else {
          curr[splitPath] = value?.varRef;
        }
      });
    });

    cachedProcess.map = cssMap;
    cachedProcess.result = result;
  } catch (err) {
    // ignore
  }

  return result;
}

/**
 * useTheme - returns the theme and helper functions to handle theming
 *
 * @param {Object} theme
 * @param {React.Node} children
 */
export const useTheme = () => {
  const theme = useChakraTheme();
  const { colorMode, toggleColorMode } = useColorMode();

  return {
    configuration: theme,
    tokens: processCssMap(theme?.__cssMap),
    colorMode,
    toggleColorMode,
  };
};
