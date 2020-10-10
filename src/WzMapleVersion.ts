/**
 * @public
 */
export enum WzMapleVersion {
  /**
   * Global MapleStory (old)
   */
  GMS = 0,

  /**
   * 新楓之谷 / 冒险岛Online / 메이플스토리 / MapleSEA / EMS (old)
   */
  EMS = 1,

  /**
   * BMS / GMS / MapleSEA / メイプルストーリー / 메이플스토리
   */
  BMS = 2,

  CLASSIC = 3,

  /**
   * 生成
   */
  GENERATE = 4,

  GETFROMZLZ = 5,

  /**
   * 自定义编码
   */
  CUSTOM = 6,

  UNKNOWN = 99,
}
