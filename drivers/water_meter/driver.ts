'use strict';

import Homey from 'homey';
import { IungoRouter } from '../../includes/iungoRouter';
import { IungoApp } from '../../types/types';

module.exports = class DriverWaterMeter extends Homey.Driver {
  async onInit() {}

  async onPair(session: any) {
    console.log('onPair');

    let state = {
      connected: true,
      iungo: null as IungoRouter | null,
    };

    session
      .setHandler('select_iungo', (data: any) => {
        let result = [];
        let iungoes = (this.homey.app as IungoApp).iungos;

        for (let iungoId in iungoes) {
          state.iungo = iungoes[iungoId];

          result.push({
            id: iungoId,
            name: state.iungo.name || state.iungo.address,
            icon: state.iungo.icon,
          });
        }

        return result;
      })
      .setHandler('list_devices', (data: any) => {
        if (this.onPairListDevices) {
          return this.onPairListDevices(state, data);
        } else {
          return new Error('missing onPairListDevices');
        }
      })
      .setHandler('disconnect', () => {
        state.connected = false;
      });
  }

  async onPairListDevices(state?: any, data?: any) {
    console.log('onPairListDevices', state);

    if (!state.iungo) return 'invalid_iungo';

    if (state.iungo instanceof Error) return state.iungo;

    const foundDevices = await (state.iungo as IungoRouter).refreshData();
    if (foundDevices instanceof Error) return foundDevices;

    let result = [];
    const foundWaterMeters = Object.values(foundDevices).filter((device) => device.type === 'water_meter');

    for (const water_meter of foundWaterMeters) {
      let deviceObj = {
        name: water_meter.name,
        data: { iungo_id: state.iungo.id, id: water_meter.id },
        icon: '/icons/default.svg',
      };

      result.push(deviceObj);
    }

    return result;
  }
};
