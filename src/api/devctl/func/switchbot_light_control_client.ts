import { SwitchbotControlClient } from "./switchbot_control_client"

export class SwitchBotLightControlClient extends SwitchbotControlClient {

  // ON/OFF命令に対して変更コマンドを送る回数(ON/OFFが明示的に分かれていないDevice仕様向け)
  private countOfTurnOn = 3;
  private countOfTurnOff = 2;

  constructor(functionId: string) {
    super(functionId);
  }

  async controlDevice(commandType: string, command: string | number): Promise<Record<string, string>> {
    console.log(`[LightControlClient] commandType: ${commandType} command: ${command}`);

    let deviceId: string;
    if (commandType === "main") {
      deviceId = this.switchbotConfig.devIds.main;
    } else if (commandType === "next") {
      deviceId = this.switchbotConfig.devIds[commandType];
    } else {
      return { error: `commandTypeが不正です. commandType=${commandType}` };
    }

    const sendCount = command === "turnOn" ? this.countOfTurnOn : command === "turnOff" ? this.countOfTurnOff : 0;
    if (sendCount === 0) {
      return { error: `commandが不正です. command=${command}` };
    }

    for (let i = 0; i < sendCount; i++) {
      const response = await fetch(`${this.switchbotConfig.devCtlEndpoint}/v1.1/devices/${deviceId}/commands`, {
        method: "POST",
        headers: this.getSwitchbotApiHeader(),
        body: JSON.stringify({
          command: "MODE",
          parameter: "default",
          commandType: "customize",
        }),
      });
      if (response.status !== 200) {
        return { error: `${commandType}のライトを付けるのに失敗しました` };
      }
    }

    return { success: `${commandType}のライトを付けました` };
  }
}