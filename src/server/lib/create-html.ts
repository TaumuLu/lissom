import htmlescape from 'htmlescape';
import { Base64 } from 'js-base64';
import { IRouter, ISSRData } from '../../lib/types';
import ParseHtml from './parse-html';
import { getStyleMap } from './style-loader';
import { getAsyncChunks } from './webpack-runtime';

interface ICreateAssetTags {
  pageHTML?: string;
  styleHTML?: string;
  router: IRouter;
  ssrData: ISSRData;
}
interface ICreateHtml extends ICreateAssetTags {
  parseHtml: ParseHtml;
}

export default function createHtml({
  pageHTML,
  styleHTML,
  parseHtml,
  router,
  ssrData,
}: ICreateHtml): string {
  const { clientRender } = ssrData;
  // 重置回初始的html
  parseHtml.reset();
  const assetTags = createAssetTags({
    pageHTML,
    styleHTML,
    router,
    ssrData,
  });
  parseHtml.injectTags(assetTags);
  // 删除script标签
  if (!clientRender) {
    parseHtml.deleteScriptTag();
  }

  return parseHtml.get();
}

const cssRel = 'stylesheet';
const scriptType = 'text/javascript';

const createAssetTags = ({
  pageHTML = '',
  styleHTML = '',
  router,
  ssrData,
}: ICreateAssetTags): any => {
  const { name } = router;
  const { rootAttr, clientRender } = ssrData;
  const { jsDefinition, cssDefinition, styleDefinition } = getDefinition(
    clientRender,
    styleHTML
  );

  return {
    headEnd: [...cssDefinition, ...styleDefinition],
    bodyStart: [
      {
        attributes: {
          id: '__ssr_root__',
          style: 'height: 100%; display: flex',
          ...rootAttr,
        },
        tagName: 'div',
        innerHTML: pageHTML,
      },
      {
        attributes: { type: scriptType },
        tagName: 'script',
        innerHTML: `
          window.__SSR_DATA__ = ${createSSRData(ssrData)}
          window.__SSR_LOADED_PAGES__ = ['${name}'];
          window.__SSR_REGISTER_PAGE__ = function(r,f) { __SSR_LOADED_PAGES__.push([r, f()]) };
        `,
      },
      ...jsDefinition,
    ],
  };
};

const createSSRData = (ssrData: ISSRData) => {
  const code = htmlescape(ssrData);
  const { isBase64 } = ssrData;
  if (isBase64) {
    return `'${Base64.encode(a)}'`;
  }
  return code;
};

const getDefinition = (clientRender: boolean, styleHTML: string) => {
  let jsDefinition = [];
  let cssDefinition = [];
  let styleDefinition = [];
  const { asyncJsChunks, asyncCssChunks } = getAsyncChunks();
  const styleMap = getStyleMap();

  if (clientRender) {
    jsDefinition = asyncJsChunks.map(src => {
      return {
        attributes: { type: scriptType, src },
        tagName: 'script',
      };
    });
  }
  cssDefinition = asyncCssChunks.map(href => {
    return {
      attributes: { href, rel: cssRel },
      tagName: 'link',
    };
  });
  styleDefinition = Object.keys(styleMap).reduce((p, key) => {
    const { parts } = styleMap[key];
    parts.forEach(value => {
      p.push(value);
    });
    return p;
  }, []);

  if (styleHTML) {
    styleDefinition.push({
      innerHTML: styleHTML,
    });
  }

  return { jsDefinition, cssDefinition, styleDefinition };
};

const a =
  '{"props":{"query":{},"asPathName":"/","owner":3,"userInfo":{"tenantId":null,"extra":{},"id":1,"phone":"18888888888","mobile":"18888888888","phoneVerified":true,"email":"ssss+111@gmail.com","type":0,"emailVerified":true,"avatarUrl":"//dev-dianshang-1.oss.job.cnoocmall.com/cnooc_dev/3d8834a1-13dc-448c-988f-d521b532a538%E6%9D%AD%E5%B7%9E%E5%9C%B0%E9%93%81%E8%A7%84%E5%88%92.png","username":"admin","realName":"问问","nickName":"admin1","channel":null,"signUpType":null,"registerIp":null,"externalSource":null,"group":"default","gender":1,"referrerId":null,"invitationCode":"1","passwordStrength":null,"locked":false,"enabled":true,"metadata":"{"userTypeList":[0,4],"shopId":0,"isAdmin":true}","outId":null,"address":null,"authorities":[],"birthday":"2018-10-23","lastLoginAt":"2019-06-14 15:52:11","createdAt":1515119181000,"updatedAt":null,"userTypeList":[0,4],"shopId":0,"phoneExist":true,"emailExist":true,"nickname":"admin1","passwordExist":true},"authData":[{"permissionId":494,"permissionName":"销售账单明细","permissionCode":"s_plat_494","parentId":null,"permissionDesc":null},{"permissionId":493,"permissionName":"销售账单_日汇总","permissionCode":"s_plat_493","parentId":null,"permissionDesc":null},{"permissionId":503,"permissionName":"订单量统计表_销售单位","permissionCode":"s_plat_503","parentId":null,"permissionDesc":null},{"permissionId":502,"permissionName":"销售量统计表_收货地","permissionCode":"s_plat_502","parentId":null,"permissionDesc":null},{"permissionId":501,"permissionName":"销售日报表客户","permissionCode":"s_plat_501","parentId":null,"permissionDesc":null},{"permissionId":500,"permissionName":"计划执行率统计","permissionCode":"s_plat_500","parentId":null,"permissionDesc":null},{"permissionId":499,"permissionName":"客户表现分析","permissionCode":"s_palt_499","parentId":null,"permissionDesc":null},{"permissionId":495,"permissionName":"运营监控","permissionCode":"s_plat_495","parentId":null,"permissionDesc":null},{"permissionId":498,"permissionName":"客户表现","permissionCode":"s_plat_498","parentId":null,"permissionDesc":null},{"permissionId":497,"permissionName":"店铺表现","permissionCode":"s_plat_497","parentId":null,"permissionDesc":null},{"permissionId":496,"permissionName":"销量指标","permissionCode":"s_plat_496","parentId":null,"permissionDesc":null},{"permissionId":461,"permissionName":"店铺销售目标","permissionCode":"s_plat_461","parentId":null,"permissionDesc":null},{"permissionId":460,"permissionName":"销售计划审核","permissionCode":"s_plat_460","parentId":null,"permissionDesc":null},{"permissionId":459,"permissionName":"销售计划管理_变更","permissionCode":"s_plat_459","parentId":null,"permissionDesc":null},{"permissionId":458,"permissionName":"销售计划管理","permissionCode":"s_plat_458","parentId":null,"permissionDesc":null},{"permissionId":389,"permissionName":"问卷结果查询","permissionCode":"s_plat_389","parentId":null,"permissionDesc":null},{"permissionId":388,"permissionName":"问卷管理","permissionCode":"s_plat_388","parentId":null,"permissionDesc":null},{"permissionId":387,"permissionName":"题目管理","permissionCode":"s_plat_387","parentId":null,"permissionDesc":null},{"permissionId":367,"permissionName":"最低限价管理","permissionCode":"s_plat_367","parentId":null,"permissionDesc":null},{"permissionId":372,"permissionName":"审批提交记录_提交","permissionCode":"s_plat_372","parentId":null,"permissionDesc":null},{"permissionId":371,"permissionName":"审批提交记录_重新编辑","permissionCode":"s_plat_371","parentId":null,"permissionDesc":null},{"permissionId":370,"permissionName":"审批提交记录","permissionCode":"s_plat_370","parentId":null,"permissionDesc":null},{"permissionId":369,"permissionName":"最低限价管理_批量编辑","permissionCode":"s_plat_369","parentId":null,"permissionDesc":null},{"permissionId":368,"permissionName":"最低限价管理_编辑","permissionCode":"s_plat_368","parentId":null,"permissionDesc":null},{"permissionId":366,"permissionName":"月结对账单","permissionCode":"s_plat_366","parentId":null,"permissionDesc":null},{"permissionId":363,"permissionName":"审批列表","permissionCode":"s_plat_363","parentId":null,"permissionDesc":null},{"permissionId":362,"permissionName":"移动端装修","permissionCode":"s_plat_362","parentId":null,"permissionDesc":null},{"permissionId":361,"permissionName":"PC装修","permissionCode":"s_plat_361","parentId":null,"permissionDesc":null},{"permissionId":382,"permissionName":"安全设置","permissionCode":"s_plat_382","parentId":null,"permissionDesc":null},{"permissionId":381,"permissionName":"我的信息","permissionCode":"s_plat_381","parentId":null,"permissionDesc":null},{"permissionId":380,"permissionName":"账号管理_重置密码","permissionCode":"s_plat_380","parentId":null,"permissionDesc":null},{"permissionId":379,"permissionName":"账号管理_冻结/解冻","permissionCode":"s_plat_379","parentId":null,"permissionDesc":null},{"permissionId":378,"permissionName":"账号管理_账号列表","permissionCode":"s_plat_378","parentId":null,"permissionDesc":null},{"permissionId":377,"permissionName":"员工管理_启用/停用","permissionCode":"s_plat_377","parentId":null,"permissionDesc":null},{"permissionId":376,"permissionName":"员工管理_授权","permissionCode":"s_plat_376","parentId":null,"permissionDesc":null},{"permissionId":375,"permissionName":"员工管理_编辑","permissionCode":"s_plat_375","parentId":null,"permissionDesc":null},{"permissionId":374,"permissionName":"员工管理_创建员工","permissionCode":"s_plat_374","parentId":null,"permissionDesc":null},{"permissionId":373,"permissionName":"员工管理_员工列表","permissionCode":"s_plat_373","parentId":null,"permissionDesc":null},{"permissionId":351,"permissionName":"消息类型_新建","permissionCode":"s_plat_351","parentId":null,"permissionDesc":null},{"permissionId":350,"permissionName":"消息类型_删除","permissionCode":"s_plat_350","parentId":null,"permissionDesc":null},{"permissionId":349,"permissionName":"消息类型_编辑","permissionCode":"s_plat_349","parentId":null,"permissionDesc":null},{"permissionId":348,"permissionName":"消息类型","permissionCode":"s_plat_348","parentId":null,"permissionDesc":null},{"permissionId":360,"permissionName":"系统消息配置","permissionCode":"s_plat_360","parentId":null,"permissionDesc":null},{"permissionId":359,"permissionName":"消息审核_通过/驳回","permissionCode":"s_plat_359","parentId":null,"permissionDesc":null},{"permissionId":358,"permissionName":"消息审核","permissionCode":"s_plat_358","parentId":null,"permissionDesc":null},{"permissionId":357,"permissionName":"消息任务","permissionCode":"s_plat_357","parentId":null,"permissionDesc":null},{"permissionId":356,"permissionName":"消息模板_删除","permissionCode":"s_plat_356","parentId":null,"permissionDesc":null},{"permissionId":355,"permissionName":"消息模板_创建消息任务","permissionCode":"s_plat_355","parentId":null,"permissionDesc":null},{"permissionId":354,"permissionName":"消息模板_编辑","permissionCode":"s_plat_354","parentId":null,"permissionDesc":null},{"permissionId":353,"permissionName":"消息模板_创建模板","permissionCode":"s_plat_353","parentId":null,"permissionDesc":null},{"permissionId":352,"permissionName":"消息模板","permissionCode":"s_plat_352","parentId":null,"permissionDesc":null},{"permissionId":347,"permissionName":"文章管理_编辑","permissionCode":"s_plat_347","parentId":null,"permissionDesc":null},{"permissionId":346,"permissionName":"文章管理_发布","permissionCode":"s_plat_346","parentId":null,"permissionDesc":null},{"permissionId":345,"permissionName":"文章管理_删除","permissionCode":"s_plat_345","parentId":null,"permissionDesc":null},{"permissionId":344,"permissionName":"文章管理_启用/停用","permissionCode":"s_plat_344","parentId":null,"permissionDesc":null},{"permissionId":343,"permissionName":"文章管理_创建文章","permissionCode":"s_plat_343","parentId":null,"permissionDesc":null},{"permissionId":342,"permissionName":"文章管理","permissionCode":"s_plat_342","parentId":null,"permissionDesc":null},{"permissionId":341,"permissionName":"专题管理_编辑","permissionCode":"s_plat_341","parentId":null,"permissionDesc":null},{"permissionId":340,"permissionName":"专题管理_删除","permissionCode":"s_plat_340","parentId":null,"permissionDesc":null},{"permissionId":339,"permissionName":"专题管理_添加子专题","permissionCode":"s_plat_339","parentId":null,"permissionDesc":null},{"permissionId":338,"permissionName":"专题管理_添加专题","permissionCode":"s_plat_338","parentId":null,"permissionDesc":null},{"permissionId":337,"permissionName":"专题管理","permissionCode":"s_plat_337","parentId":null,"permissionDesc":null},{"permissionId":319,"permissionName":"企业资质审核","permissionCode":"s_plat_319","parentId":null,"permissionDesc":null},{"permissionId":324,"permissionName":"店铺准入审核_通过/驳回","permissionCode":"s_plat_324","parentId":null,"permissionDesc":null},{"permissionId":323,"permissionName":"店铺准入审核","permissionCode":"s_plat_323","parentId":null,"permissionDesc":null},{"permissionId":322,"permissionName":"专业资质审核_分配店铺","permissionCode":"s_plat_322","parentId":null,"permissionDesc":null},{"permissionId":321,"permissionName":"专业资质审核_准入更多店铺","permissionCode":"s_plat_321","parentId":null,"permissionDesc":null},{"permissionId":320,"permissionName":"专业资质审核","permissionCode":"s_plat_320","parentId":null,"permissionDesc":null},{"permissionId":386,"permissionName":"客户管理_冻结/解冻","permissionCode":"s_plat_386","parentId":null,"permissionDesc":null},{"permissionId":385,"permissionName":"客户管理","permissionCode":"s_plat_385","parentId":null,"permissionDesc":null},{"permissionId":383,"permissionName":"现货订单合同","permissionCode":"s_plat_383","parentId":null,"permissionDesc":null},{"permissionId":384,"permissionName":"合同模板管理","permissionCode":"s_plat_384","parentId":null,"permissionDesc":null},{"permissionId":400,"permissionName":"合同信息管理","permissionCode":"s_plat_400","parentId":null,"permissionDesc":null},{"permissionId":447,"permissionName":"对账文件管理","permissionCode":"s_plat_reconciliation_file_manage","parentId":null,"permissionDesc":null},{"permissionId":365,"permissionName":"销售账单","permissionCode":"s_plat_365","parentId":null,"permissionDesc":null},{"permissionId":364,"permissionName":"平台账户对账","permissionCode":"s_plat_364","parentId":null,"permissionDesc":null},{"permissionId":335,"permissionName":"敏感词管理_编辑","permissionCode":"s_plat_335","parentId":null,"permissionDesc":null},{"permissionId":334,"permissionName":"敏感词管理_添加敏感词","permissionCode":"s_plat_334","parentId":null,"permissionDesc":null},{"permissionId":333,"permissionName":"敏感词管理","permissionCode":"s_plat_333","parentId":null,"permissionDesc":null},{"permissionId":332,"permissionName":"评价管理_显示评价","permissionCode":"s_plat_332","parentId":null,"permissionDesc":null},{"permissionId":331,"permissionName":"评价管理","permissionCode":"s_plat_331","parentId":null,"permissionDesc":null},{"permissionId":330,"permissionName":"退款单列表","permissionCode":"s_plat_330","parentId":null,"permissionDesc":null},{"permissionId":329,"permissionName":"订单列表","permissionCode":"s_plat_329","parentId":null,"permissionDesc":null},{"permissionId":336,"permissionName":"敏感词管理_删除","permissionCode":"s_plat_336","parentId":null,"permissionDesc":null},{"permissionId":328,"permissionName":"店铺审核_开店审核/变更审核","permissionCode":"s_plat_328","parentId":null,"permissionDesc":null},{"permissionId":327,"permissionName":"店铺审核","permissionCode":"s_plat_327","parentId":null,"permissionDesc":null},{"permissionId":326,"permissionName":"店铺管理_关闭","permissionCode":"s_plat_326","parentId":null,"permissionDesc":null},{"permissionId":325,"permissionName":"店铺管理","permissionCode":"s_plat_325","parentId":null,"permissionDesc":null},{"permissionId":318,"permissionName":"资质要求管理","permissionCode":"s_plat_318","parentId":null,"permissionDesc":null},{"permissionId":317,"permissionName":"资质库管理_编辑","permissionCode":"s_plat_317","parentId":null,"permissionDesc":null},{"permissionId":316,"permissionName":"资质库管理_新增","permissionCode":"s_plat_316","parentId":null,"permissionDesc":null},{"permissionId":315,"permissionName":"资质库管理","permissionCode":"s_plat_315","parentId":null,"permissionDesc":null},{"permissionId":314,"permissionName":"SKU列表","permissionCode":"s_plat_314","parentId":null,"permissionDesc":null},{"permissionId":313,"permissionName":"商品审核列表","permissionCode":"s_plat_313","parentId":null,"permissionDesc":null},{"permissionId":312,"permissionName":"电商物料管理","permissionCode":"s_plat_312","parentId":null,"permissionDesc":null},{"permissionId":311,"permissionName":"品牌管理","permissionCode":"s_plat_311","parentId":null,"permissionDesc":null},{"permissionId":310,"permissionName":"属性库管理","permissionCode":"s_plat_310","parentId":null,"permissionDesc":null},{"permissionId":309,"permissionName":"前台类目","permissionCode":"s_plat_309","parentId":null,"permissionDesc":null},{"permissionId":308,"permissionName":"后台类目","permissionCode":"s_plat_308","parentId":null,"permissionDesc":null},{"permissionId":463,"permissionName":"等级包管理_审核","permissionCode":"s_plat_463","parentId":null,"permissionDesc":null},{"permissionId":462,"permissionName":"等级包管理","permissionCode":"s_plat_462","parentId":null,"permissionDesc":null},{"permissionId":468,"permissionName":"评级结果管理_审核","permissionCode":"s_plat_468","parentId":null,"permissionDesc":null},{"permissionId":467,"permissionName":"评级结果管理","permissionCode":"s_plat_467","parentId":null,"permissionDesc":null},{"permissionId":466,"permissionName":"评级模板管理_审核","permissionCode":"s_plat_466","parentId":null,"permissionDesc":null},{"permissionId":465,"permissionName":"评级模板管理","permissionCode":"s_plat_465","parentId":null,"permissionDesc":null},{"permissionId":464,"permissionName":"等级包店铺关联","permissionCode":"s_plat_464","parentId":null,"permissionDesc":null}],"globalCtx":{"location":{"hash":"","href":"http://local.web-dev.job.cnoocmall.com/","host":"local.web-dev.job.cnoocmall.com","hostname":"local.web-dev.job.cnoocmall.com","origin":"http://local.web-dev.job.cnoocmall.com","pathname":"/","port":"local.web-dev.job.cnoocmall.com","protocol":"http","search":""},"navigator":{"userAgent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36","language":"zh-CN,zh;q=0.9,en;q=0.8,zh-TW;q=0.7"},"fontSize":20},"platform":{"isServer":true,"isWeb":true,"isIOS":false,"isAndroid":false,"isAndroidWeb":false,"isWechat":false,"isAndroidWechat":false,"isIosWechat":false,"notTerminusWeb":true,"isIosWeb":false,"isSafariMobile":false,"isSafari":false,"channel":2}},"asyncProps":[{"finish":true,"error":null,"value":{"userInfo":{"tenantId":null,"extra":{},"id":1,"phone":"18888888888","mobile":"18888888888","phoneVerified":true,"email":"ssss+111@gmail.com","type":0,"emailVerified":true,"avatarUrl":"//dev-dianshang-1.oss.job.cnoocmall.com/cnooc_dev/3d8834a1-13dc-448c-988f-d521b532a538%E6%9D%AD%E5%B7%9E%E5%9C%B0%E9%93%81%E8%A7%84%E5%88%92.png","username":"admin","realName":"问问","nickName":"admin1","channel":null,"signUpType":null,"registerIp":null,"externalSource":null,"group":"default","gender":1,"referrerId":null,"invitationCode":"1","passwordStrength":null,"locked":false,"enabled":true,"metadata":"{"userTypeList":[0,4],"shopId":0,"isAdmin":true}","outId":null,"address":null,"authorities":[],"birthday":"2018-10-23","lastLoginAt":"2019-06-14 15:52:11","createdAt":1515119181000,"updatedAt":null,"userTypeList":[0,4],"shopId":0,"phoneExist":true,"emailExist":true,"nickname":"admin1","passwordExist":true},"designData":{"page":{"id":9,"name":"首页","pageCategoryId":3,"siteId":3,"path":"/index","title":"首页","keywords":"","description":"","layout":null,"isIndex":true,"autoReleaseTime":null,"autoReleaseParts":null,"ext":null,"createdAt":"2019-02-25T12:44:47.000Z","updatedAt":"2019-02-25T13:00:02.000Z","deletedAt":null},"serviceData":{},"designData":{"head":"[{"id":"head_1","type":"container","path":"","name":""}]","body":"[{"id":"body_1","type":"container","path":"","config":{"__styles":{"backgroundColor":"#f5f5f5"},"container":{"mode":"prop","data":[],"splitNum":""}},"childIds":["body_64","body_71","body_48","body_5","body_20","body_25","body_36","body_3"],"name":""},{"id":"body_2","type":"container","path":"","config":{"__styles":{"width":"100%"}},"childIds":["body_46"],"name":""},{"id":"body_3","type":"row","path":"","childIds":["body_2"],"name":""},{"id":"body_4","type":"container","path":"","config":{"__styles":{"width":"100%","marginBottom":"20px"},"container":{"mode":"px","data":[1200],"splitNum":1},"__classes":["eve-container-align-center"]},"childIds":["body_7"],"name":""},{"id":"body_5","type":"row","path":"","childIds":["body_4"],"name":""},{"id":"body_6","type":"container","path":"","config":{"__styles":{"width":"1200px"}},"childIds":["body_9"],"name":""},{"id":"body_7","type":"row","path":"","childIds":["body_6"],"name":""},{"id":"body_8","type":"container","path":"","config":{"__styles":{"width":"100%"},"container":{"mode":"px","data":[291,291,291,291],"splitNum":4}},"childIds":["body_14"],"name":""},{"id":"body_9","type":"row","path":"","childIds":["body_8"],"name":""},{"id":"body_10","type":"container","path":"","config":{"__styles":{"width":"291px","marginRight":"12px"}},"childIds":["body_15"],"name":""},{"id":"body_11","type":"container","path":"","config":{"__styles":{"width":"291px","marginRight":"12px"}},"childIds":["body_16"],"name":""},{"id":"body_12","type":"container","path":"","config":{"__styles":{"width":"291px","marginRight":"12px"}},"childIds":["body_17"],"name":""},{"id":"body_13","type":"container","path":"","config":{"__styles":{"width":"291px"}},"childIds":["body_18"],"name":""},{"id":"body_14","type":"row","path":"","childIds":["body_10","body_11","body_12","body_13"],"name":""},{"id":"body_15","type":"component","path":"design/image","config":{"image":{"src":"http://cnooc-retail-mall.oss-cn-beijing.aliyuncs.com/cnooc_test/768472d1-2f27-409d-a0ce-c9a1cf9b815f%E5%B1%8F%E5%B9%95%E5%BF%AB%E7%85%A7%202019-03-15%2016.13.43.png","link":"http://web-test.mall.cnooc.com.cn/qidian"}},"name":""},{"id":"body_16","type":"component","path":"design/image","config":{"image":{"src":"http://cnooc-retail-mall.oss-cn-beijing.aliyuncs.com/cnooc_test/9bccab5d-f5dd-4a09-bc63-b8f11273bdb6%E5%B1%8F%E5%B9%95%E5%BF%AB%E7%85%A7%202019-03-15%2016.14.26.png","link":"http://web-test.mall.cnooc.com.cn/lianhua"}},"name":""},{"id":"body_17","type":"component","path":"design/image","config":{"image":{"src":"http://cnooc-retail-mall.oss-cn-beijing.aliyuncs.com/cnooc_test/1ce1012e-2417-4a2d-bf27-7a0f6bc36224%E5%B1%8F%E5%B9%95%E5%BF%AB%E7%85%A7%202019-03-15%2016.14.56.png"}},"name":""},{"id":"body_18","type":"component","path":"design/image","config":{"image":{"src":"http://cnooc-retail-mall.oss-cn-beijing.aliyuncs.com/cnooc_test/0f7ac027-d048-4c07-98ff-6e936569bec1%E5%B1%8F%E5%B9%95%E5%BF%AB%E7%85%A7%202019-03-15%2016.15.15.png"}},"name":""},{"id":"body_19","type":"container","path":"","config":{"__styles":{"width":"100%","marginTop":"10px","marginBottom":"32px"},"container":{"mode":"px","data":[1200],"splitNum":1},"__classes":["eve-container-align-center"]},"childIds":["body_22"],"name":""},{"id":"body_20","type":"row","path":"","childIds":["body_19"],"name":""},{"id":"body_21","type":"container","path":"","config":{"__styles":{"width":"1200px"}},"childIds":["body_23"],"name":""},{"id":"body_22","type":"row","path":"","childIds":["body_21"],"name":""},{"id":"body_23","type":"component","path":"design/common/information","config":{"carousel":[{"src":"http://parana.oss-cn-hangzhou.aliyuncs.com/cnooc/91b28d58-1e97-4eb4-a72c-bf9b9663cbd1%E5%B1%8F%E5%B9%95%E5%BF%AB%E7%85%A7%202019-02-25%2014.59.54.png","id":"6"},{"src":"http://cnooc-retail-mall.oss-cn-beijing.aliyuncs.com/cnooc_test/c7f5d601-3e4a-478b-99ae-3177a4ed9842%E5%B1%8F%E5%B9%95%E5%BF%AB%E7%85%A7%202019-03-07%2010.18.55.png","id":"4"},{"src":"http://cnooc-retail-mall.oss-cn-beijing.aliyuncs.com/cnooc_test/b3c60b91-f59d-41c9-bb4b-2f66faf4343e%E5%B1%8F%E5%B9%95%E5%BF%AB%E7%85%A7%202019-03-07%2010.19.03.png","id":"3"}],"title":"最新资讯"},"name":""},{"id":"body_24","type":"container","path":"","config":{"__styles":{"width":"100%","marginBottom":"32px"},"container":{"mode":"px","data":[1200],"splitNum":1},"__classes":["eve-container-align-center"]},"childIds":["body_27"],"name":""},{"id":"body_25","type":"row","path":"","childIds":["body_24"],"name":""},{"id":"body_26","type":"container","path":"","config":{"__styles":{"width":"1200px"}},"childIds":["body_29"],"name":""},{"id":"body_27","type":"row","path":"","childIds":["body_26"],"name":""},{"id":"body_28","type":"container","path":"","config":{"__styles":{"width":"100%"},"container":{"mode":"px","data":[592,592],"splitNum":2}},"childIds":["body_32"],"name":""},{"id":"body_29","type":"row","path":"","childIds":["body_28"],"name":""},{"id":"body_30","type":"container","path":"","config":{"__styles":{"width":"592px","marginRight":"16px"}},"childIds":["body_33"],"name":""},{"id":"body_31","type":"container","path":"","config":{"__styles":{"width":"592px"}},"childIds":["body_34"],"name":""},{"id":"body_32","type":"row","path":"","childIds":["body_30","body_31"],"name":""},{"id":"body_33","type":"component","path":"design/image","config":{"image":{"src":"http://parana.oss-cn-hangzhou.aliyuncs.com/cnooc/4f74084f-7eef-4abc-8553-8e577c659c02%E5%B1%8F%E5%B9%95%E5%BF%AB%E7%85%A7%202019-02-25%2014.55.51.png"}},"name":""},{"id":"body_34","type":"component","path":"design/image","config":{"image":{"src":"http://cnooc-retail-mall.oss-cn-beijing.aliyuncs.com/cnooc_test/0e949e3a-c059-4d86-8e3f-dd4ff86040ad%E5%B1%8F%E5%B9%95%E5%BF%AB%E7%85%A7%202019-03-15%2016.17.15.png"}},"name":""},{"id":"body_35","type":"container","path":"","config":{"__styles":{"width":"100%","marginBottom":"70px"},"container":{"mode":"px","data":[1200],"splitNum":1},"__classes":["eve-container-align-center"]},"childIds":["body_38"],"name":""},{"id":"body_36","type":"row","path":"","childIds":["body_35"],"name":""},{"id":"body_37","type":"container","path":"","config":{"__styles":{"width":"1200px"}},"childIds":["body_40"],"name":""},{"id":"body_38","type":"row","path":"","childIds":["body_37"],"name":""},{"id":"body_39","type":"container","path":"","config":{"__styles":{"width":"100%"},"container":{"mode":"px","data":[592,592],"splitNum":2}},"childIds":["body_43"],"name":""},{"id":"body_40","type":"row","path":"","childIds":["body_39"],"name":""},{"id":"body_41","type":"container","path":"","config":{"__styles":{"width":"592px","marginRight":"16px"}},"childIds":["body_44"],"name":""},{"id":"body_42","type":"container","path":"","config":{"__styles":{"width":"592px"}},"childIds":["body_45"],"name":""},{"id":"body_43","type":"row","path":"","childIds":["body_41","body_42"],"name":""},{"id":"body_44","type":"component","path":"design/common/news","config":{"count":"3","needMore":true,"tabs":[{"title":"洞察","id":"1"},{"title":"行业资讯","id":"3"},{"title":"行业数据","id":"7"}],"title":"资讯与行情"},"name":""},{"id":"body_45","type":"component","path":"design/common/news","config":{"count":"3","needMore":true,"tabs":[{"title":"活动公告","id":"1"},{"title":"平台公告","id":"3"},{"title":"企业活动","id":"7"}],"title":"公告"},"name":""},{"id":"body_46","type":"component","path":"design/common/infoModal","config":{"time":1553003529252,"title":"中国海油电商系统上线啦~！","content":"中国海油电商平台已经完成上线前的内部测试，顺利进入UAT阶段，欢迎各位同事到系统中进行测试、体验。"},"name":""},{"id":"body_47","type":"container","path":"","config":{"__styles":{"width":"100%"},"container":{"mode":"prop","data":[],"splitNum":"0"},"__classes":["eve-container-align-center"]},"childIds":["body_61"],"name":""},{"id":"body_48","type":"row","path":"","childIds":["body_47"],"name":""},{"id":"body_49","type":"component","path":"design/common/login","config":{"opacity":85,"loginHref":"/login","signupHref":"/register","buyerHref":"/allOrderList","platform":"中国海油电商平台"},"name":""},{"id":"body_50","type":"container","path":"","config":{"__styles":{"width":"240px"}},"childIds":["body_49"],"name":""},{"id":"body_51","type":"row","path":"","childIds":["body_50"],"name":""},{"id":"body_52","type":"container","path":"","config":{"__styles":{"width":"100%"},"container":{"mode":"px","data":[240],"splitNum":1},"__classes":["eve-container-align-right"]},"childIds":["body_51"],"name":""},{"id":"body_53","type":"row","path":"","childIds":["body_52"],"name":""},{"id":"body_54","type":"container","path":"","config":{"__styles":{"width":"1200px"}},"childIds":["body_53"],"name":""},{"id":"body_55","type":"row","path":"","childIds":["body_54"],"name":""},{"id":"body_56","type":"container","path":"","config":{"__styles":{"width":"100%","marginTop":"-447px"},"container":{"mode":"px","data":[1200],"splitNum":1},"bordertype":"top","__classes":["eve-container-align-center"]},"childIds":["body_55"],"name":""},{"id":"body_57","type":"row","path":"","childIds":["body_56"],"name":""},{"id":"body_58","type":"component","path":"design/common/carousel","config":{"carousel":[{"src":"http://cnooc-retail-mall.oss-cn-beijing.aliyuncs.com/cnooc_test/76964c6c-f465-42af-a2cc-7747c69c5997%E7%82%BC%E5%8C%96%E9%A6%96%E9%A1%B5%E8%BD%AE%E6%92%AD.png","link":""},{"src":"http://cnooc-retail-mall.oss-cn-beijing.aliyuncs.com/cnooc_test/a79b80c4-9659-4100-ae32-a934ff23cc38%E9%A6%96%E9%A1%B5%E8%BD%AE%E6%92%AD.png","link":""},{"src":"http://cnooc-retail-mall.oss-cn-beijing.aliyuncs.com/cnooc_test/f068505c-95b1-4101-843f-f38572dfe21c%E6%B0%94%E7%94%B5%E9%A6%96%E9%A1%B5%E8%BD%AE%E6%92%AD.png","link":""}],"time":2.5,"height":455,"arrows":true},"name":""},{"id":"body_59","type":"container","path":"","config":{"__styles":{"width":"100%"}},"childIds":["body_58"],"name":""},{"id":"body_60","type":"row","path":"","childIds":["body_59"],"name":""},{"id":"body_61","type":"row","path":"","childIds":["body_62"],"name":""},{"id":"body_62","type":"container","path":"","config":{"__styles":{"width":"100%"}},"childIds":["body_60","body_57"],"name":""},{"id":"body_63","type":"container","path":"","config":{"__styles":{"width":"100%","backgroundColor":"#fff"},"container":{"mode":"prop","data":[],"splitNum":""}},"childIds":["body_66","body_68"],"name":""},{"id":"body_64","type":"row","path":"","childIds":["body_63"],"name":""},{"id":"body_65","type":"container","path":"","config":{"__styles":{"width":"100%"}},"name":""},{"id":"body_66","type":"row","path":"","childIds":["body_65"],"name":""},{"id":"body_67","type":"container","path":"","config":{"__styles":{"width":"100%"}},"childIds":["body_69"],"name":""},{"id":"body_68","type":"row","path":"","childIds":["body_67"],"name":""},{"id":"body_69","type":"component","path":"design/common/search-header","config":{"searchWidth":"500","logo":{"src":"http://cnooc-retail-mall.oss-cn-beijing.aliyuncs.com/cnooc_test/12f15c61-26cb-427b-ab42-3daeadc00727323232.png"},"preferences":"","needHot":true,"hotItemSearchText":"热词1","hotArticleSearchText":"热词2"},"name":""},{"id":"body_70","type":"container","path":"","config":{"__styles":{"width":"100%","backgroundColor":"#fff"}},"childIds":["body_72"],"name":""},{"id":"body_71","type":"row","path":"","childIds":["body_70"],"name":""},{"id":"body_72","type":"component","path":"design/common/site-nav","config":{"count":"5","navs":[{"title":"首页","href":"/"},{"title":"气电商城","href":"/qidian"},{"title":"炼化商城","href":"/lianhua"},{"title":"客服中心","href":"/help"},{"title":"金融资讯","href":"/jinrong"}]},"name":""}]","foot":"[{"id":"foot_1","type":"container","path":"","name":""}]"},"designHash":1560499715657}}}],"pathname":"/","clientRender":true,"serverRender":true,"rootAttr":{},"isBase64":false}';
