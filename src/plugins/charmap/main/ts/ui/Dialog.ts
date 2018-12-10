/**
 * Copyright (c) Tiny Technologies, Inc. All rights reserved.
 * Licensed under the LGPL or a commercial license.
 * For LGPL see License.txt in the project root for license information.
 * For commercial licenses see https://www.tiny.cloud/
 */

import { Arr, Cell, Throttler } from '@ephox/katamari';
import { Editor } from 'tinymce/core/api/Editor';
import Actions from '../core/Actions';
import Scan from '../core/Scan';
import { UserDefined, CharMap } from '../core/CharMap';
import { Types } from '@ephox/bridge';

const patternName = 'pattern';

const open = function (editor: Editor, charMap: CharMap[]) {
  const makeGroupItems = (): Types.Dialog.BodyComponentApi[] => [
    {
      label: 'Search',
      type: 'input',
      name: patternName
    },
    {
      type: 'collection',
      name: 'results',
      columns: 'auto'
    }
  ];

  const makeTabs = () => {
    return Arr.map(charMap, (charGroup) => {
      return {
        title: charGroup.name,
        items: makeGroupItems()
      };
    });
  };

  const currentTab = charMap.length === 1 ? Cell(UserDefined) : Cell('All');

  const makePanel = (): Types.Dialog.PanelApi => ({ type: 'panel', items: makeGroupItems() });

  const makeTabPanel = (): Types.Dialog.TabPanelApi => ({ type: 'tabpanel', tabs: makeTabs() });

  const scanAndSet = (dialogApi: Types.Dialog.DialogInstanceApi<typeof initialData>, pattern: string) => {
    Arr.find(charMap, (group) => group.name === currentTab.get()).each((f) => {
      const items = Scan.scan(f, pattern.toLowerCase());
      dialogApi.setData({
        results: items
      });
    });
  };

  const SEARCH_DELAY = 40;

  const updateFilter = Throttler.last((dialogApi: Types.Dialog.DialogInstanceApi<typeof initialData>) => {
    const pattern = dialogApi.getData().pattern;
    scanAndSet(dialogApi, pattern);
  }, SEARCH_DELAY);

  const body = charMap.length === 1 ? makePanel() : makeTabPanel();

  const initialData = {
    pattern: '',
    results: Scan.scan(charMap[0], '')
  };

  const bridgeSpec: Types.Dialog.DialogApi<typeof initialData> = {
    title: 'Special Character',
    size: 'normal',
    body,
    buttons: [
      {
        type: 'cancel',
        name: 'close',
        text: 'Close'
      }
    ],
    initialData,
    onAction(api, details) {
      if (details.name === 'results') {
        Actions.insertChar(editor, details.value);
        api.close();
      }
    },

    onTabChange: (dialogApi, title: string) => {
      currentTab.set(title);
      updateFilter.throttle(dialogApi);
    },

    onChange: (dialogApi, changeData) => {
      if (changeData.name === patternName) {
        updateFilter.throttle(dialogApi);
      }
    }
  };
  editor.windowManager.open(bridgeSpec);
};

export default {
  open
};