import * as crypto from "crypto";
import * as uuid from "uuid";
import { DeviceControlClient } from "../device_control_client";

type DeviceIds = {
  main: string;
  [id: string]: string;
}

type FunctionsDeviceIds = {
  [functionId: string]: DeviceIds;
}

export abstract class SwitchbotControlClient implements DeviceControlClient {
  constructor(
    functionId: string,
    protected switchbotConfig = {
      devCtlToken: JSON.parse(process.env.APP_SECRETS || "{}").SWITCHBOT_TOKEN || process.env.SWITCHBOT_TOKEN || "",
      devCtlSecret: JSON.parse(process.env.APP_SECRETS || "{}").SWITCHBOT_SECRET_KEY || process.env.SWITCHBOT_SECRET_KEY || "",
      devCtlEndpoint: process.env.SWITCHBOT_ENDPOINT!,
      devIds: undefined as unknown as DeviceIds
    }
  ) {
    this.initCheck(functionId, switchbotConfig);
  };

  private initCheck(functionId: string, switchbotConfig: Record<string, string | DeviceIds>) {
    if (!switchbotConfig.devIds) {
      const devIdsMap = JSON.parse(process.env.APP_SECRETS || "{}").SWITCHBOT_FUNCTION_DEVICEIDS_MAP || process.env.SWITCHBOT_FUNCTION_DEVICEIDS_MAP || ""
      const devIds = (JSON.parse(devIdsMap) as FunctionsDeviceIds)[functionId];
      if (!devIds) {
        throw new Error(`DeviceIds for functionId ${functionId} is not defined.`);
      }
      switchbotConfig.devIds = devIds;
    }

    for (const key of Object.keys(this.switchbotConfig)) {
      if (!switchbotConfig[key]) {
        throw new Error(`switchbotConfig.${key} is required but not set.`);
      }
    }
  }

  protected getSwitchbotApiHeader(): Record<string, string> {
    const token = this.switchbotConfig.devCtlToken;
    const secret = this.switchbotConfig.devCtlSecret;
    const nonce = uuid.v4();
    const t = Date.now();
    const stringToSign = `${token}${t}${nonce}`;
    const sign = crypto.createHmac("sha256", secret).update(stringToSign).digest("base64");

    return {
      Authorization: token,
      "Content-Type": "application/json",
      charset: "utf8",
      t: t.toString(),
      sign: sign,
      nonce: nonce,
    };
  }

  abstract controlDevice(commandType: string, command: string | number): Promise<Record<string, string>>;
}