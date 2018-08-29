import 'common';
import 'js/icons';
import 'jquery-ui';
import 'jquery.tocify';
import '../js/jquery.i18n.properties'
import buyfo from '../imgs/buyfo.png'
import buyfo_en from '../imgs/buyfo-en.png'

var browser = {
  versions: (function () {
    var u = navigator.userAgent,
      app = navigator.appVersion;
    return {
      trident: u.indexOf('Trident') > -1, //IE内核
      presto: u.indexOf('Presto') > -1, //opera内核
      webKit: u.indexOf('AppleWebKit') > -1, //苹果、谷歌内核
      gecko: u.indexOf('Gecko') > -1 && u.indexOf('KHTML') == -1, //火狐内核
      mobile: !!u.match(/AppleWebKit.*Mobile.*/), //是否为移动终端
      ios: !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/), //ios终端
      android: u.indexOf('Android') > -1 || u.indexOf('Linux') > -1, //android终端或者uc浏览器
      iPhone: u.indexOf('iPhone') > -1, //是否为iPhone或者QQHD浏览器
      iPad: u.indexOf('iPad') > -1, //是否iPad
      webApp: u.indexOf('Safari') == -1, //是否web应该程序，没有头部与底部
      weixin: u.indexOf('MicroMessenger') > -1, //是否微信 （2015-01-22新增）
      qq: u.match(/\sQQ/i) == ' qq' //是否QQ
    };
  })(),
  language: (navigator.browserLanguage || navigator.language).toLowerCase()
};



Vue.component('Message', {
  template: `
    <div class="message">
      <p :class="['name']">
        {{message.from.name}}
      </p>
      <div class="tele-message-content-wrapper">
        <div class="tele-message-content" >
        <div v-for="content in message.messagelist" :class="!content ? 'textdiv' : ''">
        {{content}}
        </div>
        </div>
        <div class="tele-message-time">
          <span>{{message.date}}</span>
        </div>
      </div>
    </div>
    `,
  props: ['message']
});

Vue.component('App', {
  template: `
      <div id="tele" :class="collapse ? 'tele-collapse' : ''">
      <div :class="isMobile ? 'hide' : 'bg'">
      <div class="top">
      <div class = "top-title">
      FIBOS 开发 电报群
      </div>
      <div class="top-member">{{members}} members</div>
      <img src="/imgs/blacklogo.png"/>
      </div>
          <div class="wrap">
            <ul class="messages" ref="messages">
              <li class="message-container" v-for="message in messages" :key="message.id">
                <Message :message="message"></Message>
              </li>
            </ul>
          </div>
          <div class="bottom">
          <div class="bottom-title">
          加入电报群和大神一期聊技术
          </div>
          <img src="/imgs/toggle-collapse.png" class="bottom-img"/>
          </div>

        </div>

        <img :src="imgSrc" alt="" class="toggle-btn" @click="toggleCollapseOrLink" />
      </div>
    `,
  data() {
    return {
      collapse: browser.versions.mobile,
      messages: [],
      isMobile: browser.versions.mobile,
      members: 0
    };
  },
  created() {
    if (!browser.versions.mobile) {
      this.initWebsocket();
    }
  },
  methods: {
    toggleCollapseOrLink() {
      if (browser.versions.mobile) {
        window.open('https://t.me/FIBOSIO');
        return;
      }
      this.collapse = !this.collapse;
    },
    pushMessage(messages, isHistory) {
      // let latestMassage = this.messages.concat(messages)
      // this.messages = latestMassage.map(function (ele) {
      //   if (ele.text) {

      //     var messagelist = ele.text.split('↵');

      //     // ele.messagelist = messagelist;
      //     alert("messagelist:"+messagelist.length)
      //     return ele
      //   }
      // });
      let latestMassage;
      if (isHistory) {
        latestMassage = messages.concat(this.messages);
      } else {
        latestMassage = this.messages.concat(messages)
      }
      this.messages = latestMassage.map(function (ele) {
        if (ele.text) {
          var escapetext = escape(ele.text)
          var escapetextlist = escapetext.split("%0A")
          var messagelist = escapetextlist.map(function (ele) {
            return unescape(ele);
          })
          ele.messagelist = messagelist;
          return ele
        }
      });

      let e = this.$refs.messages;
      scroll = e.scrollHeight - e.scrollTop;
      if (isHistory) {
        this.$nextTick(function () {
          e.scrollTop = e.scrollHeight;
        });
      }
      if (scroll >= 300 && scroll <= 600) {
        this.$nextTick(function () {
          e.scrollTop = e.scrollHeight;
        });
      }

    },
    pushMembers(data) {
      this.members = data;
    },
    initWebsocket() {

      var protocol = window.location.protocol
      var host = window.location.host

      // var message = [{
      //   text:"sadasd↵↵1111",
      //   id:1,
      //   name
      // }]
      // this.pushMessage(message);

      //this.socket = new WebSocket(`${protocol.indexOf('https') >= 0 ? 'wss' : 'ws'}://${host}/1.0/push`)
      this.socket = new WebSocket('ws://115.47.142.152:9090/1.0/push');

      this.socket.onmessage = e => {
        var d = JSON.parse(e.data);
        if (d.data && d.data.messages) {
          this.pushMessage(d.data.messages, d.data.isHistory);
          // if ($('ul.messages')[0].scrollHeight = $('ul.messages').scrollTop() + $(".wrap").height()) {
          //   $('ul.messages').scrollTop($('ul.messages')[0].scrollHeight)
          // }
        }
        if (d.data && d.data.members) {
          this.pushMembers(d.data.members);
        }
      };


    }
  },
  computed: {
    imgSrc() {
      return this.collapse
        ? '/imgs/toggle-collapse.png'
        : '/imgs/toggle-open.png';
    }
  }
});

new Vue({
  el: '#tele-app-wrapper',
  template: `<App />`
});


$(function () {
  var localLanguage = localStorage.getItem("fibosLanguage")
  if (localLanguage) {
    changeLanguage(JSON.parse(localLanguage))
  } else {
    changeLanguage('zh');
  }

  function changeLanguage(language) {
    localStorage.setItem('fibosLanguage', JSON.stringify(language))
    setCookie(language);
    jQuery.i18n.properties({
      name: 'strings', //资源文件名称
      path: '../i18n/', //资源文件路径
      mode: 'map', //用Map的方式使用资源文件中的值
      language: `${language === 'zh' ? 'zh' : 'en'} `,
      callback: function () {//加载成功后设置显示内容
        $('#Home').html($.i18n.prop('Home'));
        $('#Roadmap').html($.i18n.prop('Roadmap'));
        $('#DEV_Community').html($.i18n.prop('DEV_Community'));
        $('#Documentation').html($.i18n.prop('Documentation'));
        $('#DEV_Guides').html($.i18n.prop('DEV_Guides'));
        $('#Basic_Modules').html($.i18n.prop('Basic_Modules'));
        $('#Built_in_Objects').html($.i18n.prop('Built_in_Objects'));
        $('#Language').html($.i18n.prop('Language'));
        $('#slogan').html($.i18n.prop('slogan'));
        $('#desc').html($.i18n.prop('desc'));
        $('#joinin').html($.i18n.prop('joinin'));
        $('#ExchangeFo').html($.i18n.prop('ExchangeFo'));
        $('#QuickDev').html($.i18n.prop('QuickDev'));
        $('#QuickDevDesc').html($.i18n.prop('QuickDevDesc'));
        $('#StartLearn').html($.i18n.prop('StartLearn'));
        $('#Characteristic').html($.i18n.prop('Characteristic'));
        $('#Fast').html($.i18n.prop('Fast'));
        $('#LowLearn').html($.i18n.prop('LowLearn'));
        $('#LessRes').html($.i18n.prop('LessRes'));
        $('#LessRam').html($.i18n.prop('LessRam'));
        $('#Security').html($.i18n.prop('Security'));
        $('#Sandbox').html($.i18n.prop('Sandbox'));
        $('#Auditable').html($.i18n.prop('Auditable'));
        $('#JavaScriptDev').html($.i18n.prop('JavaScriptDev'));
        $('#Stable').html($.i18n.prop('Stable'));
        $('#Bancor').html($.i18n.prop('Bancor'));
        $('#Onestep').html($.i18n.prop('Onestep'));
        $('#FIBOSDev').html($.i18n.prop('FIBOSDev'));
        $('#btn-bancor-download').html($.i18n.prop('btn-bancor-download'));
        $('#FIBOSRoadmap').html($.i18n.prop('FIBOSRoadmap'));
        $('#TestNet').html($.i18n.prop('TestNet'));
        $('#MainNet').html($.i18n.prop('MainNet'));
        $('#SmartWallet').html($.i18n.prop('SmartWallet'));
        $('#Release').html($.i18n.prop('Release'));
        $('#Partners').html($.i18n.prop('Partners'));
        $('#FOSmartWallet').html($.i18n.prop('FOSmartWallet'));
        $('#Supports').html($.i18n.prop('Supports'));
        $('#VacantSeat').html($.i18n.prop('VacantSeat'));
        $('#Doc').html($.i18n.prop('Doc'));
        $('#ContactUs').html($.i18n.prop('ContactUs'));
        $('#Will').html($.i18n.prop('Will'));
        $('#DEV_Guides1').html($.i18n.prop('DEV_Guides1'));
        $('#Basic_Modules1').html($.i18n.prop('Basic_Modules1'));
        $('#Built_in_Objects1').html($.i18n.prop('Built_in_Objects1'));
        $('#VacantSeat1').html($.i18n.prop('VacantSeat1'));
        $('#VacantSeat2').html($.i18n.prop('VacantSeat2'));
        $('#StrategicPartners').html($.i18n.prop('StrategicPartners'));
        $('#Buy').html($.i18n.prop('Buy'));
        $('#Pass').html($.i18n.prop('Pass'));
        $('#News').html($.i18n.prop('News'));
        $('#Download').html($.i18n.prop('Download'));
        $('#Total').html($.i18n.prop('Total'));
        $('#Rate').html($.i18n.prop('Rate'));
        var FastHeight = window.document.getElementById('Fast').scrollHeight;
        var StableHeight = window.document.getElementById('Stable').scrollHeight;
        if (language === 'zh') {
          $("#QuickDevDesc").css("font-size", "1.2rem")
          $("#GetStart").css("font-size", "1.2rem")
          $("#QuickDev").css("font-size", "2rem")
          $("#StartLearn").css("font-size", "1.3rem")
        } else {
          $("#QuickDevDesc").css("font-size", "1.1rem")
          $("#QuickDev").css("font-size", "1.6rem")
          $("#GetStart").css("font-size", "1rem")
          $("#StartLearn").css("font-size", "1rem")
        }
        $("#LessRes").css("height", FastHeight)
        $("#Security").css("height", FastHeight)
        $("#Auditable").css("height", StableHeight)
      }
    });
  }

  function setCookie(language) {
    window.document.cookie = ("lang" + "=" + language + ";");
  }

  $('#language-zh').click(function () {
    changeLanguage('zh');


  })

  $('#language-en').click(function () {

    changeLanguage('en');

  })
})



$(document).ready(() => {
  function hack() {
    Object.assign(Eos.modules.json.schema, {
      retire: {
        base: '',
        action: {
          name: 'retire',
          account: 'eosio.token'
        },
        fields: {
          quantity: 'asset',
          memo: 'string'
        }
      },
      close: {
        base: '',
        action: {
          name: 'close',
          account: 'eosio.token'
        },
        fields: {
          owner: 'account_name',
          symbol: 'symbol'
        }
      },
      excreate: {
        base: '',
        action: {
          name: 'excreate',
          account: 'eosio.token'
        },
        fields: {
          issuer: 'account_name',
          maximum_supply: 'asset',
          maximum_exchange: 'asset',
          connector_weight: 'float64',
          reserve_supply: 'asset',
          reserve_balances: 'asset',
          buy_fee_rate: 'float64',
          sell_fee_rate: 'float64',
          can_issue: 'bool'
        }
      },
      exissue: {
        base: '',
        action: {
          name: 'exissue',
          account: 'eosio.token'
        },
        fields: {
          to: 'account_name',
          quantity: 'extended_asset',
          memo: 'string'
        }
      },
      extransfer: {
        base: '',
        action: {
          name: 'extransfer',
          account: 'eosio.token'
        },
        fields: {
          from: 'account_name',
          to: 'account_name',
          quantity: 'extended_asset',
          memo: 'string'
        }
      },
      exretire: {
        base: '',
        action: {
          name: 'exretire',
          account: 'eosio.token'
        },
        fields: {
          quantity: 'extended_asset',
          memo: 'string'
        }
      },
      exclose: {
        base: '',
        action: {
          name: 'exclose',
          account: 'eosio.token'
        },
        fields: {
          owner: 'account_name',
          symbol: 'extended_symbol'
        }
      },
      exdestroy: {
        base: '',
        action: {
          name: 'exdestroy',
          account: 'eosio.token'
        },
        fields: {
          owner: 'account_name',
          symbol: 'extended_symbol'
        }
      },
      exchange: {
        base: '',
        action: {
          name: 'exchange',
          account: 'eosio.token'
        },
        fields: {
          owner: 'account_name',
          quantity: 'extended_asset',
          to: 'extended_asset',
          memo: 'string'
        }
      }
    });
  }

  hack();

  var protocol = window.location.protocol

  const eosHttpEndPoint = protocol + '//se-rpc.fibos.io:8870';
  const eosChainId =
    '038f4b0fc8ff18a4f0842a8f0564611f6e96e8535901dd45e43ac8691a1c4dca';

  const EosClient = privitekey =>
    Eos({
      chainId: eosChainId,
      httpEndpoint: eosHttpEndPoint,
      keyProvider: privitekey,
      expireInSeconds: 60,
      broadcast: true,
      verbose: false,
      sign: true,
      logger: {
        log: null,
        error: null
      }
    });

  var easingFn = function (t, b, c, d) {
    var ts = (t /= d) * t;
    var tc = ts * t;
    return b + c * (tc * ts + -5 * ts * ts + 10 * tc + -10 * ts + 5 * t);
  };
  var options = {
    useEasing: true,
    easingFn: easingFn,
    useGrouping: true,
    separator: ',',
    decimal: '.'
  };

  eosjs_ecc.randomKey().then(pr => {
    const pb = eosjs_ecc.privateToPublic(pr)
    function getLatestPrice() {
      EosClient(pr)
        .getTableRows(true, 'eosio.token', 'eosio', 'stats')
        .then(data => {
          const { rows } = data
          if (!!rows && rows instanceof Array) {
            rows.forEach((item, index) => {
              if (!!item && item.supply && item.supply.indexOf('FO') >= 0) {
                const {
                  connector_weight,
                  reserve_connector_balance,
                  connector_balance,
                  reserve_supply,
                  supply
                } = item
                const supply_numStr = supply.split(' FO')[0]
                let supply_numPre = 0
                if (!!supply_numStr && supply_numStr.split('.').length >= 2) {
                  supply_numPre = supply_numStr.split('.')[1].length
                }
                const b_supply = new BigNumber(supply_numStr)
                const b_reserve_supply = new BigNumber(reserve_supply.split(' FO')[0])
                const b_cw = new BigNumber(connector_weight)
                const b_balances = new BigNumber(connector_balance.split(' EOS')[0]).plus(
                  new BigNumber(reserve_connector_balance.split(' EOS')[0])
                )

                const price = b_balances
                  .div(b_cw.times(b_reserve_supply.plus(b_supply)))
                  .toFixed(supply_numPre, 8)

                $('#myTargetElement').text(new BigNumber(1).div(price).toFixed(4, 1))
              }
            })
          }
        })
        .catch(error => {
        })
    }
    setInterval(getLatestPrice, 20000);
    getLatestPrice();
  })
});
