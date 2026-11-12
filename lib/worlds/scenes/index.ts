import type * as T from 'three';
import type {Concept,ConceptId} from '../concepts';
import type {Model} from '../kit';
import {buildNoticing} from './noticing';
import {buildSilence} from './silence';
import {buildWonder} from './wonder';
import {buildBetween} from './between';
import {buildTrain} from './train';
import {buildEveryday} from './everyday';
import {buildAtlas} from './atlas';
import {buildHours} from './hours';

export const conceptBuilders:Record<ConceptId,(root:T.Group,c:Concept)=>Model>={noticing:buildNoticing,silence:buildSilence,wonder:buildWonder,between:buildBetween,train:buildTrain,everyday:buildEveryday,atlas:buildAtlas,hours:buildHours};
