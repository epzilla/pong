import { Component } from 'preact';
import { route } from 'preact-router';
import Rest from '../lib/rest-service';
import LocalStorageService from '../lib/local-storage-service';
import SelectPlayerModal from '../components/selectPlayerModal';
import Stepper from '../components/stepper';
import SegmentedControl from '../components/segmentedControl';
import Toggle from '../components/toggle';

export default class StartMatch extends Component {
  constructor(props) {
    super(props);
    let selectedPlayToOption = -1;
    if (props.config && props.config.playTo && (props.config.playTo === 11 || props.config.playTo === 21)) {
      selectedPlayToOption = props.config.playTo;
    }
    this.state = {
      player1: null,
      player2: null,
      isSelectingPlayer: 0,
      players: [],
      playTo: props.config && props.config.playTo ? props.config.playTo : 21,
      selectedPlayToOption,
      winByTwo: props.config && props.config.winByTwo,
      bestOf: props.config && props.config.bestOf ? props.config.bestOf : 4,
      updateEveryPoint: props.config && typeof props.config.updateEveryPoint !== 'undefined' ? props.config.updateEveryPoint : 0,
      playAllGames: props.config && typeof props.config.playAllGames !== 'undefined' ? props.config.playAllGames : 0,
      showPlayToInput: false
    }
  }

  componentDidMount() {
    Rest.get('players').then(players => {
      this.setState({ players }, () => {
        let cachedState = LocalStorageService.get('start-match-state');
        let { num, addedPlayer } = this.props;
        let player;
        if (num && addedPlayer) {
          player = this.state.players.find(p => p.id === parseInt(addedPlayer));
        }

        if (player) {
          let stateCopy = Object.assign({}, this.state);
          if (cachedState.player1) {
            stateCopy.player1 = cachedState.player1;
          }
          if (cachedState.player2) {
            stateCopy.player2 = cachedState.player2;
          }
          stateCopy[`player${num}`] = player;
          this.setState(stateCopy);
        } else {
          this.setState({
            player1: cachedState && cachedState.player1 ? cachedState.player1 : players[0],
            player2: cachedState && cachedState.player2 ? cachedState.player2 : players[1]
          });
        }
      });
    });
  }

  setAndCacheState = (obj) => {
    this.setState(obj, () => {
      let { player1, player2 } = this.state;
      LocalStorageService.set('start-match-state', { player1, player2 });
    });
  };

  selectPlayer = (p) => {
    if (this.state.isSelectingPlayer === 1) {
      this.setAndCacheState({ player1: p, isSelectingPlayer: null });
    } else if (this.state.isSelectingPlayer === 2) {
      this.setAndCacheState({ player2: p, isSelectingPlayer: null });
    }
  };

  dismissModal = () => {
    this.setState({ isSelectingPlayer: null });
  };

  beginMatch = () => {
    let packet = Object.assign({ deviceId: this.props.device.id }, this.state);
    Rest.post('matches/create', packet).then(({ match }) => {
      LocalStorageService.delete('start-match-state');
      let matchIds = LocalStorageService.get('match-ids');
      if (!matchIds || matchIds.length === 0) {
        matchIds = [match.id];
      } else {
        matchIds.push(match.id);
      }
      LocalStorageService.set('match-ids', matchIds);
      route('/update-score');
    })
  };

  addNewPlayer = (num) => {
    if (this.state.player1 || this.state.player2) {
      LocalStorageService.set('start-match-state', this.state);
    }
    route(`/add-new-player/new-match/${num}`);
  };

  onBestOfChange = ({ amount }) => {
    this.setState({ bestOf: amount });
  };

  onPlayToOptionChange = (playTo) => {
    if (playTo === 11 || playTo === 21) {
      this.setState({ selectedPlayToOption: playTo, playTo, showPlayToInput: false });
    } else {
      this.setState({ selectedPlayToOption: -1, showPlayToInput: true });
    }
  };

  onPlayToInputChange = (e) => {
    this.setState({ playTo: parseInt(e.target.value) });
  };

  onScoringTypeChange = (updateEveryPoint) => {
    this.setState({ updateEveryPoint })
  };

  togglePlayAllGames = () => {
    this.setState({ playAllGames: !this.state.playAllGames });
  };

  render() {
    let { player1, player2 } = this.state;
    return (
      <div class="main new-match">
        <h2>Start New Match</h2>
        <div class="player-select-blocks">
          {
            player1 ?
            <div class="player-selected-block flex-col flex-center">
              <h3>{ player1.fname } { player1.lname }</h3>
              {
                this.state.players.length > 2 ?
                <button class="btn primary" onClick={() => this.setState({ isSelectingPlayer: 1 })}>Change</button> :
                <button class="btn primary" onClick={() => this.addNewPlayer(1)}>Add New Player</button>
              }
            </div>
            :
            <div class="player-selected-block flex-col flex-center">
              <button class="btn primary big" onClick={() => this.setState({ isSelectingPlayer: 1 })}>Select</button>
            </div>
          }
          <div class="versus-separator">vs.</div>
          {
            player2 ?
            <div class="player-selected-block flex-col flex-center">
              <h3>{ player2.fname } { player2.lname }</h3>
              {
                this.state.players.length > 2 ?
                <button class="btn primary" onClick={() => this.setState({ isSelectingPlayer: 2 })}>Change</button> :
                <button class="btn primary" onClick={() => this.addNewPlayer(2)}>Add New Player</button>
              }
            </div>
            :
            <div class="player-selected-block flex-col flex-center">
              <button class="btn secondary big" onClick={() => this.setState({ isSelectingPlayer: 2 })}>Select</button>
            </div>
          }
        </div>
        <hr />
        <div class="match-settings flex-col">
          <div class="flex-col margin-bottom-1rem">
            <div class="stepper-wrap flex-center">
              <label class="label">Best of</label>
              <Stepper full onChange={(e) => this.onBestOfChange(e)} initialValue={this.state.bestOf} />
              <label class="label">Games</label>
            </div>
            <hr />
            <div class="flex-center flex-col controls-col">
              <label class="label">Play to</label>
              <SegmentedControl
                options={[
                  { label: '11', value: 11 },
                  { label: '21', value: 21 },
                  { label: 'Other', value: -1 }
                ]}
                value={this.state.selectedPlayToOption}
                onChange={(e) => this.onPlayToOptionChange(e)}
              />
              { this.state.showPlayToInput ?
                <input type="number" name="play-to-input" id="play-to-input" value={this.state.playTo} onChange={this.onPlayToInputChange} />
                : null
              }
            </div>
            <hr />
            <div class="flex-center flex-col controls-col">
              <label class="label">Play all games, even if match clinched?</label>
              <Toggle altColor id={'play-all-toggle'} toggled={this.togglePlayAllGames} onOff={!!this.state.playAllGames} property="playAllGames" />
            </div>
            <hr />
            <div class="flex-center flex-col controls-col">
              <label class="label">Update scores</label>
              <SegmentedControl
                options={[
                  { label: 'After each game', value: 0 },
                  { label: 'Point-by-point', value: 1 }
                ]}
                value={this.state.updateEveryPoint}
                onChange={(e) => this.onScoringTypeChange(e)}
              />
            </div>
          </div>
          <hr />
        </div>
        <div class="start-btn-wrap margin-bottom-1rem">
          <button class="btn success big" onClick={() => this.beginMatch()}>Begin</button>
        </div>
        <SelectPlayerModal {...this.state} select={this.selectPlayer} dismiss={this.dismissModal} />
      </div>
    );
  }
}