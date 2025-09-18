import time,os,sys,gc
import argparse
import math
import pandas as pd
import numpy as np

from config import setting
from common import f1_scores, LINE, bertlog

from poidata import (load_files, load_dataset, getThemes, getPOIFullNames, getPOIThemes, poi_name_dict)
from Bootstrap import inferPOITimes2,get_distance_matrix
from simpletransformers.classification import (
    ClassificationModel, ClassificationArgs,
    MultiLabelClassificationModel, MultiLabelClassificationArgs)

global NEARBY_POIS,MIN_SCORE
NEARBY_POIS = 0
MIN_SCORE = -9999

global theme2num
global num2theme
global poi2themes
global dist_mat
global dist_dict
dist_dict=None


def distance_dict(pois):
    allpois = pois['poiID'].unique()
    poi_dict = dict()
    dist_mat = get_distance_matrix(pois)
    poi_dict_p = dict()
    for p in allpois:
        ### allpois[p] -> [p1:dist1, p2:dist2 ,....] by distance
        for q in allpois:
            if p != q:
                pq_dist = dist_mat[ (p,q) ]
                poi_dict_p[q] = dist_mat[(p,q)]
                #print(f" ({p},{q}) : {poi_dict_p[q]} ")

        sorted_poi_dict_p = dict(sorted(poi_dict_p.items(), key=lambda x: x[1]))
        poi_dict[p] = sorted_poi_dict_p.copy()
    return poi_dict

def get_model_args(bert, city, epochs, pois, train_df):
    model_args = ClassificationArgs()
    # model_args.optimizer = ...
    model_args.no_deprecation_warning=True
    model_args.num_train_epochs = epochs
    model_args.reprocess_input_data = True,
    model_args.overwrite_output_dir = True
    model_args.disable_tqdm = True
    model_args.use_multiprocessing = True

    model_args.use_early_stopping = True
    model_args.early_stopping_delta = 0.001
    model_args.early_stopping_metric = "mcc"
    model_args.early_stopping_metric_minimize = False
    model_args.early_stopping_patience = 5
    model_args.evaluate_during_training_steps = 5
    model_args.use_multiprocessing = True
    model_args.use_multiprocessing_for_evaluation = True
    model_args.use_multiprocessed_decoding = True
    model_args.no_deprecation_warning=True

    ### output / save disk space
    model_args.save_steps = -1
    model_args.save_model_every_epoch = False

    model_args.output_dir = ("/var/tmp/output/output_{}_e{}_{}".format(city, epochs, bert))
    #bertlog.debug("LINE {}, FUNC: model_args.output_dir : {}".format(LINE(), model_args.output_dir))
    model_args.disable_tqdm = True

    #model_ args.overwrite_out_put_dir = True
    #model_ args.out_put_dir = "out_put/out_put_{}_e{}".format(city,epochs)

    #### PRINT WHOLE DATA TABLE
    pd.set_option('display.max_rows', None)
    bertlog.info("LINE {}, {} TRAINING POIs:\n{}\n\n".format(LINE(), city, str(pois)))
    bertlog.info("LINE {}, {} TRAINING DATA:\n{}\n\n".format(LINE(), city, str(train_df)))
    bertlog.info("LINE {}, {} TRAINING PARAMS: {}".format(LINE(), city, str(model_args)))

    model_args.early_stopping_delta = 0.00001
    model_args.early_stopping_metric = "mcc"
    model_args.early_stopping_metric_minimize = False
    model_args.early_stopping_patience = 5
    model_args.evaluate_during_training_steps = 10000
    return model_args

def get_bertmodel(model_str):
    LABEL_TYPE=''
    MODEL_NAME=''
    # default BERT model
    #if log: log.info("(2) USING PREDICTION MODEL : %s", model_str)
    if model_str in ['bert', 'BERT']:
        LABEL_TYPE='bert'
        MODEL_NAME='bert-base-uncased'
        #bertlog.info("USING BERT PREDICTION (model_str)")
    elif model_str in ['roberta', 'Roberta']:
        LABEL_TYPE='roberta'
        MODEL_NAME='roberta-base'
        #bertlog.info("USING roberta-base PREDICTION (model_str)")
    elif model_str in ['albert','Alberta']:
        LABEL_TYPE='albert'
        MODEL_NAME='albert-base-v2'
        #bertlog.info("USING albert-base PREDICTION (model_str)")
    elif model_str in ['XLNet','xlnet']:
        LABEL_TYPE='xlnet'
        MODEL_NAME='xlnet-base-cased'
        #bertlog.info("USING XLnet-base PREDICTION (model_str)")
    elif model_str in ['distilbert','DistilBert']:
        LABEL_TYPE='distilbert'
        MODEL_NAME='distilbert-base-cased'
        #bertlog.info("USING distilbert-base PREDICTION (model_str)")
    elif model_str =='xlm':
        LABEL_TYPE='xlm'
        MODEL_NAME='xlm-base'
        #bertlog.info("USING xlmnet PREDICTION")
    elif model_str=='xlmroberta':
        LABEL_TYPE='xlmroberta'
        MODEL_NAME='xlmroberta-base'
        #bertlog.info("USING xlmroberta-base PREDICTION")
    ## XLNet, XLM
    else:
        if bertlog: bertlog.error("Unknown Model:  %s".format(model_str))
        assert(False)
    return LABEL_TYPE, MODEL_NAME

def train_bert_model(city, pois, array, epochs, model_str, use_cuda=True):
    log=bertlog
    npois = pois['poiName'].count()
    theme2num, num2theme, poi2theme = get_themes_ids(pois)
    train_data=[]

    ### BERT
    if log: log.info("(1) ### model_str  : %s", model_str)
    NUM_LABELS= 1+ npois+ len(theme2num)
    LABEL_TYPE, MODEL_NAME = get_bertmodel(model_str)

    for items in array:
        #print("LINE_152. list_subseqs : ", items)
        #bertlog.debug("LINE %d, %s", LINE(), items)
        assert(len(items)>4)
        listA = items[:-4]

        strlistA = [str(i) for i in listA]

        resultA = items[-2]
        resultB = items[-1]
        assert(len(strlistA) % 4 == 0)
        trainItem=",".join(strlistA)
        # e.g. 65072601,9,Park,65072601,12,Cultural

        past_pois = listA[1::4]
        cur_poi = past_pois[-1]
        #nearbys = find_nearby_pois(pois,cur_poi, past_pois, NEARBY_POIS)
        #nearbys = [str(p) for p in nearbys]
        train_data.append( [ trainItem, resultA ] )

    train_df = pd.DataFrame(train_data)
    train_df.columns = ["text", "labels"]

    #if log: log.debug("train_df:\n%s\n", str(train_df))
    if log: log.info("(3) ### model_type : %s", LABEL_TYPE)
    if log: log.info("(4) ### model_name : %s", MODEL_NAME)
    assert(LABEL_TYPE)
    assert(MODEL_NAME)

    model_args = get_model_args(model_str, city, epochs, pois, train_df)

    print (f" -> LABEL_TYPE : {LABEL_TYPE}")
    print (f" -> MODEL_NAME : {MODEL_NAME}")
    print (f" -> NUM_LABELS : {NUM_LABELS}")
    print (f" -> use_cuda : {use_cuda}")
    print (f" -> cuda_device : 1")
    try:
        model = ClassificationModel(model_type= LABEL_TYPE, \
                                    model_name= MODEL_NAME, \
                                    num_labels= NUM_LABELS, \
                                    use_cuda=   use_cuda,   \
                                    cuda_device=1,          \
                                    args=       model_args)

        model.train_model(train_df, no_deprecation_warning=False)
        if log: log.info("(4) line %d : train_ city_bert_model RETURNING : %s", LINE(), str(model))
        if log: log.info("(5) >>> ... train_ city_bert_model")
    except Exception as err:
        print( err)
        return None
    #bertlog.debug("train_bert_model... train_df :\n%s\n\n", str(train_df))
    #print(train_df)
    return model,train_df ## train_bert_model

def getTrajectories(pois, userVisits):
    trajectories=dict()
    for userid in userVisits['userID'].unique():
        if userid not in trajectories: trajectories[userid] = []
        userid_visit = userVisits[ userVisits['userID'] ==userid ]

        ### TRAINING DATA
        for seqid in userid_visit['seqID'].unique():
            seqtable = userid_visit[ userid_visit['seqID'] == seqid ]
            seqtable.sort_values(by=['dateTaken'])

            pids = list(seqtable['poiID'])
            # remove duplicate
            pids = list(dict.fromkeys(pids))

            #sentense_list.append(pids)
            trajectories[userid].append(pids)

    return trajectories

def predict_mask_pos(pois, model, seq, maskpos):
    print(f"\n\n\n-- predict_mask_pos / ( <model>, seq= {seq}, maskpos= {maskpos}  )")

    theme2num, num2theme, poi2theme = get_themes_ids(pois)

    numpois=len(poi2theme)
    numthemes=len(theme2num)

    if True: ## predict next POI
        ## GIVEN argmax_theme
        ## next predict POI-ID given theme
        maskedseq=[]

        ## PART-1
        for poi in seq[:maskpos]:
            # theme
            maskedseq.append( poi )
            maskedseq.append( poi2theme[poi] )
        # PART-2
        maskedseq.append('[MASK]')
        # PART-3
        for poi in seq[maskpos:]:
            maskedseq.append( poi )
            maskedseq.append( poi2theme[poi] )

        predict_str=",".join([ str(i) for i in maskedseq ])
        predictions, raw_outputs = model.predict( to_predict=[predict_str] )
        prediction=predictions[0]
        raw_output=raw_outputs[0]

    ### STEP-1  ... SKIP VISITED POIs
    for i in range(len(seq)):
        poi=seq[i]
        raw_output[ int(poi) ] = -999999

    ### STEP-2  ... LOOK UP only POIS in raw_ouput
    poi_raw_output = raw_output[1:numpois]

    ### STEP-3 SCALE near-by POIs
    ## amax starts from poi-0
    amax = 1+int(np.argmax(poi_raw_output))
    amaxval = raw_output[amax]

    if amaxval <= -999999:
        ### when predicted (amax) is already in seq
        ### there is no more POIs to predict,
        return None, None, None

    assert(amax not in seq)
    assert(maskedseq[maskpos*2] == '[MASK]')
    unmasked = maskedseq.copy()
    unmasked[maskpos*2] = amax

    #bertlog.debug("line %d,             amax : %s", LINE(), str(amax))
    #bertlog.debug("line %d, poi2theme.keys() : %s", LINE(), str(poi2theme.keys()))
    assert(amax in poi2theme.keys())
    amax_theme = poi2theme[amax]
    unmasked.insert(maskpos*2+1, amax_theme)
    unmasked_pois=unmasked[0::2]
    return (amax,amaxval,unmasked_pois)

def predict_mask(pois, model,predseq):
    predseq_str=[str(i) for i in predseq]
    possible_unmasked={}
    for maskpos in range(1,len(predseq)):
        nextpoi, nextval, unmasked_seq = predict_mask_pos(pois, model, predseq, maskpos)
        if maskpos and nextpoi and nextval > 0:
            possible_unmasked[maskpos] = nextpoi, maskpos, nextval, unmasked_seq

    possible_unmasked= dict( sorted(possible_unmasked.items(), key=lambda item: item[1], reverse=True))
    if len(possible_unmasked) > 0:
        assert(len(possible_unmasked) > 0)
        for key in possible_unmasked:
            nextpoi, maskpos, nextval, unmasked_seq = possible_unmasked[key]
            return nextpoi, maskpos, nextval, unmasked_seq
    bertlog.error("LINE %d -- no prediction is found for [%s]", LINE(), predseq)
    return None,None,None,None

def estimate_duration(predseq, durations):
    for p in predseq: assert(str(p) != "")
    print("-- estimate_duration( '{}', {})".format(predseq,durations))
    print("-- predseq           ==> {}\n".format(predseq))
    print("-- len(predseq)      ==> {}\n".format(len(predseq)))
    assert('[MASK]' not in predseq)

    total_duration = 0
    bertlog.info("line %d... predseq : %s", LINE(), predseq)
    poiids = predseq[2::4]
    bertlog.info("line %d... predseq : %s", LINE(), predseq)
    #bertlog.info("line %d... durations : %s", LINE(), durations)
    bertlog.info("line %d... poiids : %s", LINE(), poiids)
    for p in poiids:
        if type(p) == str: p=int(p)
        if p in durations:
            intertimes = durations[p]
        else:
            intertimes = [1, 5 * 60] ## 5 minites
        duration = math.ceil(max(intertimes))
        total_duration += duration
    #print(f"line {LINE()}...  total duration {predseq}  {int(total_duration)} / {int(total_duration/60)} min ")
    print("line {}... {} -> total_duration : {}".format(LINE(), str(predseq), total_duration))
    return total_duration

# def predict_mask(pois, model,predseq):
def predict_seq(pois, model, p1, pz, seqid_duration, boot_duration):
    predseq=[p1,pz]
    num_pois=pois['poiID'].count()

    #bertlog.debug("predict_seq(pois, model, %d, %d, %d, boot_duration)", p1,pz,seqid_duration)
    for iter in range(num_pois):
        #bertlog.debug("predict_seq, iter:%d", iter)
        ### INPUT: predseq
        nextpoi, maskpos, nextval, unmasked_seq = predict_mask(pois, model, predseq)
        if not nextpoi: break ### cannot predict next poi
        ## estimate duratiion of new_predseq
        predseq = unmasked_seq
        print("LINE_480: predseq : ", predseq)
        assert(len(unmasked_seq) % 4 == 0)
        print("line {}".format(LINE))
        poi_duration = estimate_duration(unmasked_seq, boot_duration)
        #bertlog.debug("predict_seq, iter:%d, predseq:%s", iter, str(predseq))
        #bertlog.debug("predict_seq, iter:%d, poi_duration:%d", iter, poi_duration)
        if poi_duration > seqid_duration: break
    ### END predict_seq
    return predseq

def getUserLocation():
    bertlog.info("line %d, reading users info: Data/user_hometown.csv", LINE())
    user2city = dict()
    usercity_df = pd.read_csv("Data/user_hometown.csv", \
                              sep=';',
                              keep_default_na=False,
                              na_values='_', 
                              dtype={'UserID':str, 'JoinDate':str, 'Occupation':str, 'Hometown':str, 'current_city':str, 'country':str} )

    # print(usercity_df)
    # assert(0)
    for i, row in usercity_df.iterrows():
        id           = row['UserID']
        current_city = row['current_city']
        country      = row['country']
        current_city = " ".join([ w.strip() for w in current_city.split(",") ])
        country      = " ".join([ w.strip() for w in country.split(",") ])

        #if country=='Unknown' and current_city=='Unknown':
        #    user2city[ id ] = "Unknown"
        #elif country=='':
        #    user2city[ id ] = current_city
        #elif current_city=='':
        #    user2city[ id ] = country
        #else:
        #    user2city[ id ] = country.strip() + " " + current_city.strip()
        if country:
            user2city[ id ] = country.strip()
        else:
            user2city[ id ] = "Unknown"
        bertlog.info(f"line %d, ID: %s => ``%s''", LINE(), id, user2city[ id ] )

    setting["User2City"]=user2city

    assert( '10259636' in user2city)
    assert( '61239510' in user2city)
    assert('Unknown' != user2city['10259636'])
    assert('Unknown' != user2city['61239510'])

    return user2city
    
def getUserCity(userid):
    if "User2City" not in setting:
        user2city= getUserLocation()
        for user in user2city:
            print(" | user2city | '{}' -> '{}'".format(user, user2city[user]))
    else:
        user2city=setting["User2City"]
    if userid in user2city:
        return user2city[userid]
    else:
        #bertlog.error(" userid (%s) not found", userid)
        return None

def bert_train_city(city, pois, userVisits, epochs, model_str='bert', USE_CUDA=True):
    import torch
    cuda_available = torch.cuda.is_available()

    log = bertlog ## PRINT LOG
    log = None    ## NO LOF
    #if log: log.debug("LINE %d, bert_train_city ", LINE() )

    theme2num, num2theme, poi2theme = get_themes_ids(pois)
    sentense_list=[]
    list_subseqs = []
    trajectories = getTrajectories(pois, userVisits)

    # print(trajectories)
    # prepare training data
    # nearby_pois=[]
    dist_dict = distance_dict(pois)

    for userid in trajectories:
        trajectory = trajectories[userid]
        for tryj in trajectories[userid]:
            if log: log.info("line %d, userid:%s, trajectory: %s", LINE(), userid, str(tryj))

            n=len(tryj)
            for head in range(0,n-1):
                for seqlen in range(2,n-head+1):
                    subseq=tryj[head:head+seqlen]
                    subseq2=[]
                    for pid in subseq:
                        user_city= getUserCity(userid)
                        if not user_city: user_city = "Unknown"

                        ## starting with USER-ID
                        subseq2.append(userid)
                        subseq2.append(user_city)
                        subseq2.append(pid)
                        subseq2.append(poi2theme[ int(pid) ])
                    list_subseqs.append(subseq2)
                    bertlog.info ("LINE %d ==> SubSeq with Themes: %s", LINE(), str(subseq2))
    if False:
        nearbys=[]
        for subseq in list_subseqs:
            subseq_pois = subseq[1::3]
            context = subseq[0:-3]
            if log: log.info ("line %d * subseq_pois: %s", LINE(), str(subseq_pois))
            if log: log.info ("line %d |     context: %s", LINE(), str(context))

            currpoi=context[-2]
            #if log: log.info ("line %d |     currpoi: %s", LINE(), str(currpoi))

            predition = subseq_pois[-1]
            if log: log.info ("line %d |   predition: %s", LINE(), str(predition))
            if log: log.info ("line %d |      subseq: %s", LINE(), str(subseq))

            ### GET NEAR BY POIs (NEARBY_ POIS)
            nearby=[]
            poi_dist = dist_dict[ currpoi ]

    bertlog.info("LINE %d <<< (MAIN) train_bert_model() >>>", LINE())
    #                                 city, pois, array,              epochs, model_str, use_cuda=True):
    print(f"city : {city}")
    print(f"epochs : {epochs}")
    print(f"model_str : {model_str}")
    print(f"use_cuda : {USE_CUDA}")
    print(f"pois : {pois}")
    print(f"array : {list_subseqs}")

    model,train_df = train_bert_model(city, pois, array=list_subseqs, epochs=epochs, model_str=model_str, use_cuda=USE_CUDA)
    assert(model)
    assert(0)
    return model,train_df

def get_themes_ids(pois):
    theme2num=dict()
    num2theme=dict()
    poi2theme=dict()
    numpois = pois['poiID'].count()

    allthemes=sorted(pois['theme'].unique())
    for i in range(len(allthemes)) :
        theme2num[allthemes[i]] = i
        num2theme[i] = allthemes[i]

    arr1 = pois['poiID'].array
    arr2 = pois['theme'].array

    for i in range(len(arr1)):
        pid   = arr1[i]
        theme = arr2[i]
        poi2theme[pid] = theme
        if theme not in theme2num.keys():
            num = numpois + len(theme2num.keys())
            theme2num[theme] = num
            num2theme[num] = theme
    return theme2num, num2theme, poi2theme

def predict_user(bertmodel, pois, user, seqid, p0, pn, t0, tn, seconds, path):
    bertlog.info("LINE:%d, -- predict_user( %s, %d,%d,%s,%s, seconds allowed:%d, path:%s )",  LINE(), user, p0,pn,t0,tn , seconds, str(path))
    bertlog.info("LINE:%d ============================================", LINE())
    bertlog.info("LINE:%d = predict_user(<Model>, [pois],", LINE())
    bertlog.info("LINE:%d =              user:%s, p0:%d, pn:%d, t0:'%s', tn:'%s'", LINE(), user, p0, pn, t0, tn)
    bertlog.info("LINE:%d ============================================", LINE())

    assert(not math.isnan(seconds))
    assert(bertmodel)

    numpois = pois['poiID'].count()
    assert(setting["User2City"])
    user2city=setting["User2City"]
    hometown=None
    if user in user2city:
        hometown=user2city[user]
        if not hometown: user2city[user]="Unknown"
        if hometown=="": user2city[user]="Unknown"
        bertlog.info("LINE:%d, -- user(%s) -> hometown(%s)",  LINE(), user, hometown)

    if hometown and hometown != "":
        pass
    if hometown:
        hometown="Unknown"
    else:
        hometown="Unknown"
    bertlog.info("LINE:%d, -- user(%s) -> hometown(%s)",  LINE(), user, hometown)
    assert(hometown!="")

    context_arr=[user, hometown, str(p0), str(t0), user, hometown, str(pn), str(tn) ]
    boot_duration = setting['bootstrap_duration']
    assert( boot_duration )

    ### get user HOMETOWN
    user_location = getUserCity(user)

    ### predict duration for just []
    predited_arr=[user,user_location, p0,t0, user,user_location, pn,tn]
    ret_predited_arr = predited_arr

    assert(len(predited_arr) % 4 == 0)
    print("line {}  predited_arr : {}".format(LINE, predited_arr))
    seq_duration = estimate_duration(predited_arr, boot_duration)

    #bertlog.debug("line %d,  estimate_duration( %s, duration: %d)", LINE(), str(predited_arr), seq_duration)
    ret_seq_duration = seq_duration

    # estimate_duration
    #bertlog.debug("")
    #bertlog.debug("LINE:%d INIT: [ %d , %d ] duration estimated: %d secs", LINE(), p0, pn, ret_seq_duration)
    #bertlog.debug("LINE:%d INIT limit (sec) : %d", LINE(),  seconds)
    #bertlog.debug("LINE:%d INIT ret_predited_arr : %s", LINE(),  ret_predited_arr)
    #bertlog.debug("LINE:%d INIT ret_seq_duration : %s", LINE(),  ret_seq_duration)
    #bertlog.debug("")

    ### predict next POI, for max. numpoi times
    #for i in range(numpois):
    i=1
    while seq_duration < seconds:
        print("line {}  predited_arr : {}".format(LINE, predited_arr))
        i = i+1
        bertlog.info("")
        bertlog.info("")
        bertlog.info("")
        bertlog.info("LINE:%d --------------------------------------------", LINE())
        bertlog.info("LINE:%d ---   ITERATION %d -- u:%s -- limit (sec):%d", LINE(), i, user, seconds)
        bertlog.info("LINE:%d --------------------------------------------", LINE())
        bertlog.info("LINE:%d BEFORE (1) context_arr: %s", LINE(), context_arr)
        bertlog.info("LINE:%d BEFORE (2) context_arr: %d", LINE(), len(context_arr))
        #print("line {}, context_arr:{}".format(LINE(), context_arr))

        unmask_score, predited_arr = predict_user_iterninary( context_arr, bertmodel, pois)

        if predited_arr:
            #bertlog.debug("line %d, BEFORE  context_arr: %s", LINE(), str(context_arr))
            #bertlog.debug("line %d, AFTER  predited_arr: %s", LINE(), str(predited_arr))
            assert('[MASK]' not in predited_arr)

            #bertlog.debug("line %d,  predited_arr: %s", LINE(), predited_arr)
            #bertlog.debug("line %d,  unmask_score: %f", LINE(), unmask_score)

            #predited_arr = arr2[unmask_score]
            bertlog.info("||| LINE:%d, u:%s, p0:%d, pn:%d, t0:%s, tn:%s", LINE(), user, p0,pn,t0,tn)
            bertlog.info("||| LINE:%d, context_arr  : %s", LINE(),   context_arr)
            bertlog.info("||| LINE:%d, predited_arr : %s", LINE(),   predited_arr)
            bertlog.info("||| LINE:%d, NEXT context_arr  : %s ", LINE(), context_arr)
            bertlog.info("||| LINE:%d, NEXT predited_arr : %s ", LINE(), predited_arr)

            ### ESTIMATE SEQUENCE DURATION
            assert(len(predited_arr) % 4 == 0)
            bertlog.info("line %d, estimate_duration(predited_arr, boot_duration)... ", LINE() )
            bertlog.info("line %d, predited_arr : %s", LINE(), predited_arr )
            assert("[MASK]" not in predited_arr)
            #bertlog.info("line %d, boot_duration : %s", LINE(), boot_duration )
            #print("line {}".format(LINE))

            poi_duration = estimate_duration(predited_arr, boot_duration)
            ### next iteration
            context_arr = predited_arr


            context_pois = predited_arr[2::4]
            context_pois = [int(p) for p in context_pois]
            assert(len(context_pois) == len(set(context_pois)))

            ### ESTIMATE DURATION
            assert(len(predited_arr) % 4 == 0)

            # calc duration from boot_duration
            predseq = predited_arr[1::4]

            assert("[MASK]" not in context_pois)
            seq_duration = estimate_duration(context_pois, boot_duration)
            assert(seq_duration)

            '''
            print("\n\nLINE:{} --------------------------------------------".format(LINE()))
            print(    "LINE:{} ==========  num POIs      : {} -- ".format(LINE(), numpois))
            print(    "LINE:{} ==========  predseq       : {} -- ".format(LINE(), predseq))
            print(    "LINE:{} ==========  predited_arr  : {} -- ".format(LINE(), predited_arr))
            print(    "LINE:{} ==========  seq_duration  : {} -- ".format(LINE(), seq_duration))
            print(    "LINE:{} ==========  seconds       : {} -- ".format(LINE(), seconds))
            print(    "LINE:{} ==========  ITERATION(end): {} -- duration:{} / time limit in seconds:{} --".format(LINE(), i+1, seq_duration, seconds))
            print(    "LINE:{} --------------------------------------------\n".format(LINE()))
            #bertlog.info("LINE:%d, duration:%d (budget:%d), predseq : %s \n\n", LINE(), seq_duration, seconds, str(predseq))
            bertlog.info("LINE:%d, duration:%d (budget:%d)\n\n\n\n", LINE(), seq_duration, seconds)
            '''

            ret_predited_arr = predited_arr
            ret_seq_duration = seq_duration

            ### TIME BUDGET OVER??
            if seq_duration > seconds and bool(predseq) and bool(seq_duration):
                if predited_arr:
                    #bertlog.debug("LINE %d, TIME BUDGET OVER ... predited_arr : %s", LINE(), predited_arr)
                    #bertlog.debug("LINE %d, TIME BUDGET OVER ... predseq : %s", LINE(), predseq)
                    pass
                    '''
#2023-04-04 11:32:25,307 |DEBUG-predict_user| LINE 645, TIME BUDGET OVER ... 
predited_arr : ['9288799', 'Unknown', '12', 'Architectural', '9288799', 'Unknown', '1', 'Building', '9288799', 'Unknown', '18', 'Religious', '9288799', 'Unknown', '21', 'Museum', '9288799', 'Unknown', '9', 'Precinct', '9288799', 'Unknown', '10', 'Architectural', '9288799', 'Unknown', '16', 'Religious', '9288799', 'Unknown', '25', 'Park', '9288799', 'Unknown', '11', 'Architectural', '9288799', 'Unknown', '5', 'Park', '9288799', 'Unknown', '7', 'Architectural']

#2023-04-04 11:32:25,308 |DEBUG-predict_user| LINE:656 *** FINAL ret_predited_arr : ['Unknown', 'Unknown', 'Unknown', 'Unknown', 'Unknown', 'Unknown', 'Unknown', 'Unknown', 'Unknown', 'Unknown', 'Unknown'] ***
#2023-04-04 11:32:25,308 |DEBUG-predict_user| LINE:657 *** FINAL ret_seq_duration : 10331 ***
#2023-04-04 11:32:25,308 |DEBUG-predict_user| 
#2023-04-04 11:32:25,308 |INFO-predict_user| LINE:671   PREDICTED SEQ: ['Unknown', 'Unknown', 'Unknown', 'Unknown', 'Unknown', 'Unknown', 'Unknown', 'Unknown', 'Unknown', 'Unknown', 'Unknown'], DURATION: 10331 / 8834 s--(limit)
#2023-04-04 11:32:25,309 |DEBUG-test_user_preference_seqid| LINE 954,  predict_user(... u:'9288799', seqid='353', p0:12, pn:7, t0:Architectural, tn:Architectural, secs:8834, hist_pois)
#2023-04-04 11:32:25,309 |DEBUG-test_user_preference_seqid| line 956, [USER/POI/Theme] => (predict_user_pid_theme, duration) => ['Unknown', 'Unknown', 'Unknown', 'Unknown', 'Unknown', 'Unknown', 'Unknown', 'Unknown', 'Unknown', 'Unknown', 'Unknown'], 10331
                    '''                  
                if seq_duration: ret_seq_duration = seq_duration
                break
        else:
            bertlog.info("LINE:%d, NO MORE RESULT from  %s", LINE(), predited_arr)
            break


    #bertlog.debug("")
    #bertlog.debug("LINE %d, AFTER %d ROUNDs of INSERTIONS...", LINE(), i)
    #bertlog.debug("LINE:%d     FINAL [ %d ,..., %d ] duration estimated: %d secs", LINE(), p0, pn, ret_seq_duration)
    #bertlog.debug("LINE:%d *** FINAL ret_predited_arr : %s ***", LINE(),  ret_predited_arr)
    #bertlog.debug("LINE:%d *** FINAL ret_seq_duration : %s ***", LINE(),  ret_seq_duration)
    #bertlog.debug("")
    '''
#2023-04-03 20:57:46,061 |DEBUG-predict_user| LINE:649     FINAL [ 2 ,..., 14 ] duration estimated: 9270 secs
#2023-04-03 20:57:46,061 |DEBUG-predict_user| LINE:650 *** FINAL ret_predited_arr : ['Austria Vienna', 'Austria Vienna', 'Austria Vienna', 'Austria Vienna', 'Austria Vienna', 'Austria Vienna', 'Austria Vienna', 'Austria Vienna', 'Austria Vienna', 'Austria Vienna', 'Austria Vienna'] ***

    '''
    assert(ret_predited_arr)
    assert(ret_seq_duration)
    assert(len(ret_predited_arr)>2)


    bertlog.info("LINE:%d   PREDICTED SEQ: %s, DURATION: %s / %d s--(limit)", \
                 LINE(), ret_predited_arr, ret_seq_duration, seconds)
    assert( len(ret_predited_arr) > 2 )
    #assert( ret_predited_arr[0]==user ) ## first-poi user
    #assert( ret_predited_arr[-3]==user ) ## last-poi user
    return ret_predited_arr, ret_seq_duration

def predict_user_insert(context_arr, bertmodel, pois, pos):
    #print("line 629 context_arr : ", context_arr)
    #print("line 630 context_arr : ", len(context_arr))
    log=bertlog
    log=None

    #if log: log.debug("\n\nnLINE %d <<<<<<<<<<<<<<<<< predict_user_insert", LINE())
    assert( '[MASK]' not in context_arr )
    assert( len(context_arr) % 4 == 0)
    assert( bertmodel)

    numpois=pois['poiID'].count()
    theme2num, num2theme, poi2theme = get_themes_ids(pois)

    userid = context_arr[0]
    poiids = context_arr[2::4]
    #bertlog.debug("LINE %d poiids in context : %s", LINE(), ", ".join(poiids))
    context_arr.insert(pos*4, '[MASK]')
    ###context_arr.insert(pos*4, '(1)'+context_arr[2])
    context_arr.insert(pos*4, context_arr[1])
    context_arr.insert(pos*4, context_arr[0])
    #print("LINE_650 : context_arr : ", context_arr)

    assert(len(context_arr) % 4 == 3) # addition [userid] [mask] tokens

    maskedstr = ','.join(context_arr)

    #print("--- line {}, predictstr: {} ".format( LINE(),  maskedstr))
    #print("--- line {}, predictstr: {} ".format( LINE(),  maskedstr))
    #print("--- line {}, predictstr: {} ".format( LINE(),  maskedstr))
    #print("--- line {}, bertmodel: {} ".format( LINE(),  bertmodel))
    predictions, raw_outputs = bertmodel.predict( to_predict=[maskedstr] )



    raw_output = raw_outputs[0]
    ## ignore past pois
    for pastpoi in poiids: raw_output[int(pastpoi)] = MIN_SCORE
    for i in range(numpois, len(raw_output)): raw_output[i] = MIN_SCORE

    poi_output=raw_output[1:]
    amax = int(np.argmax(poi_output))
    predict_poi = amax+1

    ### CHECK POTIVE PREDICTION
    if amax < 0:
        bertlog.info("LINE %d => NO RESULT: context_arr: {%s} , pos: %d)", LINE(), context_arr, pos)
        assert(False)
        return None,None
    elif amax > numpois:
        bertlog.info("LINE %d => NO RESULT \n  context_arr: {%s} , pos: %d)", LINE(), context_arr, pos)
        ### NO MORE POT TO
        return None,None
    elif str(predict_poi) in context_arr:
        ### NO MORE PREDICTION
        return None,None
    else:
        assert(str(predict_poi) not in context_arr)
        amaxval = raw_output[amax]

        #bertlog.debug("predict_user_insert ---> predict_poi : %d", predict_poi)
        #bertlog.debug("predict_user_insert ---> context_arr : %s", str(context_arr))

        predicted_arr = context_arr.copy()

        ### FILL IN ARG_MAX & THEME
        assert( str(predict_poi) not in context_arr)
        #print("predicted_arr[ pos*4   ] => predicted_arr[ {} ] => {}".format(pos*4  , predicted_arr[pos*4]))
        #print("predicted_arr[ pos*4+1 ] => predicted_arr[ {} ] => {}".format(pos*4+1, predicted_arr[pos*4+1]))
        #print("predicted_arr[ pos*4+2 ] => predicted_arr[ {} ] => {}".format(pos*4+2, predicted_arr[pos*4+2]))
        #print("predicted_arr[ pos*4+3 ] => predicted_arr[ {} ] => {}".format(pos*4+3, predicted_arr[pos*4+3]))
        assert( predicted_arr[pos*4+2]  == '[MASK]')
        assert( poi2theme[predict_poi])
        assert('[MASK]' in predicted_arr)

        predicted_arr[pos*4+2] = str(predict_poi)
        predicted_arr.insert(pos*4+3, poi2theme[predict_poi])

        # POST CHECK
        assert( predicted_arr[pos*4+2] != '[MASK]')
        assert('[MASK]' not in predicted_arr)

        #print("LINE_716  predicted_arr => {}".format(predicted_arr))

        ### CHECK UNIQUE
        poiids = predicted_arr[2::4]
        #if log: log.debug("LINE %d >>> predicted_IDS: %s\n", LINE(), poiids)
        assert( len(poiids) == len(set(poiids)) )

        #bertlog.debug("LINE %d ---> ", LINE())
        #bertlog.debug("  pos             : %d", pos)
        #bertlog.debug("    context_arr   : %s", context_arr)
        #bertlog.debug("                   pos*4+2   = %d", pos*4+2)
        #bertlog.debug("    predicted_arr[ pos*4+2 ] = %s", predicted_arr[pos*4+2])
        #bertlog.debug("    predicted_arr : %s", predicted_arr)
        assert(context_arr[pos*4+2] == '[MASK]')
        #bertlog.debug("LINE %d ---> ", LINE())

        #if log: log.debug("line %d context_arr   : %s", LINE(), context_arr )
        #if log: log.debug("line %d predicted_arr : %s", LINE(), predicted_arr )
        #if log: log.debug("line %d predicted_arr : %s", LINE(), predicted_arr )

        #if log: log.info("line %d predicted_arr : %0.6f / %s", LINE(), amaxval, str(predicted_arr) )
        assert(0 == len(predicted_arr)%4)

        ### CHECK UNIQUE
        poiids = predicted_arr[2::4]
        #if log: log.debug("LINE %d >>> predicted_IDS: %s\n", LINE(), poiids)
        assert( len(poiids) == len(set(poiids)) )

        #bertlog.debug("LINE %d >>>>>>>>>>>>>>>>> predict_user_insert\n%s\n%s\n", LINE(), str(amaxval), str(predicted_arr))
        assert('[MASK]' not in predicted_arr)
        return (amaxval, predicted_arr)

def predict_user_iterninary(context, bertmodel, pois):
    #print("predict_user_iterninary...  context : ", context)
    assert('[MASK]' not in context)
    assert(bertmodel)
    assert(len(context) % 4 == 0)

    context_array = [str(el) for el in context[2::4] ]
    context_text = ",".join(context_array)

    #bertlog.debug("BEGIN _iterninary(context: [%s], bertmodel, pois)", context_text)
    #bertlog.debug("BEGIN _iterninary(context: [%s], bertmodel, pois)", context_text)
    bertlog.debug("BEGIN _iterninary(context: [%s], bertmodel, pois)", context_text)

    n=int(len(context) / 4)
    #bertlog.debug("n=%d, context : %s", n, context)
    predicted_prob,predicted_arr = None,None

    poiids = pois['poiID'].unique()
    theme2num, num2theme, poi2theme = get_themes_ids(pois)
    numpois = len(poi2theme.keys())


    # dict : [ pval -> unmasked ]
    # predicted poi in context

    ### PREDICT n x [MASK]
    predicted_arr_dict=dict()
    for idx in range(1,n):
        context2 = context.copy()
        #bertlog.debug("**************************** (A) idx : %d", idx)
        #bertlog.debug("line %d, MASK:%d, context2 : \n'%s'", LINE(), idx, context2 )
        assert('[MASK]' not in context2)
        assert(len(context2) % 4 == 0)

        #bertlog.debug("******* LINE %d predict_user_insert( i: %d, n: %d) \n", LINE(), idx, n)
        assert( len(context2) % 4 == 0)

        pval,context_arr2 = predict_user_insert(context2, bertmodel, pois, idx)
        assert( len(context_arr2) % 4 == 0)
        assert( context_arr2[1] != '')

        if context_arr2 and pval > MIN_SCORE:
            #bertlog.debug("******* LINE %d  (B) idx : %d", LINE(), idx)
            assert(context_arr2)
            assert('[MASK]' not in context_arr2)
            assert(len(context_arr2) % 4 == 0)

            predicted_arr_dict[pval] = context_arr2
            #bertlog.debug("LINE %d POSSIBLE INSERTION -->  predicted_arr_dict : [ %f ] --> context_arr2 : %s\n", LINE(), pval, context_arr2)
            ### CHECK (user,poiid,theme) format
            assert( len(context_arr2) % 4 == 0 )
            ### CHECK context_arr2
            poiids = context_arr2[1::3]

            bertlog.info("******* LINE %d  (C) context_arr2 : %s", LINE(), context_arr2)
            bertlog.info("******* LINE %d  (C) poiids : %s", LINE(), ",".join(poiids))

            bertlog.info("LINE %d  n      : %d", LINE(), n)
            bertlog.info("LINE %d  poiids : %d", LINE(), len(poiids))
            bertlog.info("LINE %d  poiids : %s", LINE(), str(poiids))

            #assert(len(poiids) == len(set(poiids)))
            #assert(len(poiids) == n)

            #for v in predicted_arr_dict:
            #    bertlog.info(">>>>> LINE %d ==>  v:%0.5f , predicted_arr_dict[ %0.5f ]  :", LINE(), v, v)
            #    bertlog.info(">>>>>     : %s",  str(predicted_arr_dict[v]) )
            #bertlog.debug("******* LINE %d  (D) idx : %d", LINE(), idx)
        else:
            #bertlog.debug("line %d, context_arr2 : %s", LINE(), context_arr2)
            #bertlog.debug("line %d, pval : %f", LINE(), pval)
            assert (pval==None or pval <= MIN_SCORE or context_arr2 == None)
            ### no more prediction from BERT model
            break

    ## checking all posible solution in predicted_arr_dict
    if predicted_arr_dict:
        for k in sorted(predicted_arr_dict.keys()): bertlog.info("###### line %d POSSIBLE (%s) -> (%f)", LINE(), predicted_arr_dict[k], k )

        keys=predicted_arr_dict.keys()
        bertlog.info("line %d  keys : %s", LINE(), keys)

        maxkey = max(predicted_arr_dict.keys())
        maxval = predicted_arr_dict[maxkey]

        bertlog.info("BEST: array:%s, prob:%f", maxval, maxkey)
        predicted_arr = maxval
        predicted_prob= maxkey

        #bertlog.debug("line %d, PREDICT STR:  %s", LINE(), str(predicted_arr) )
        #bertlog.debug("line %d, PREDICT PROB: %f", LINE(), predicted_prob )
        bertlog.info("UNMASKED ... predicted_arr : %s", str(predicted_arr))
        assert('[MASK]' not in predicted_arr)

        context_pois=predicted_arr[2::4]
        context_pois=[int(p) for p in context_pois]
        #print("line {} context_pois 1 : {}".format(LINE(), sorted(set(context_pois))))
        #print("line {} context_pois 2 : {}".format(LINE(), sorted(context_pois)))
        #assert(len(context_pois) == len(set(context_pois)))
        #for i in range(len(predicted_arr)):
        #    bertlog.debug("LINE %d. TYPE ( predicted_arr[%d] ) => %s (%s)", LINE(), i, str(predicted_arr[i]), type(predicted_arr[i]))
        assert('[MASK]' not in predicted_arr)
        return predicted_prob,predicted_arr
    else:
        bertlog.info(" END iterninary(context: '%s', bertmodel, pois)\n\n\n\n\n", context)
        return None,None

def test_user_preference_seqid(city, epochs, u, seqid, boot_duration, pois, user_visit, bertmodel):
    #### USER SEQID -> PREDICTION
    theme2num, num2theme, poi2theme = get_themes_ids(pois)
    user_visit_seqid_dt = user_visit[user_visit['seqID']==seqid].sort_values(by=['dateTaken'])
    hist_pois = user_visit_seqid_dt['poiID'].unique()

    #### GET num2user / user2num
    num2user = dict()
    user2num = dict()
    for u in sorted(set( user_visit['userID'].unique() )):
        n=len(num2user)
        num2user[n] = u
        user2num[u] = n

    ### SKIPPING EMPTY FRAME
    if user_visit_seqid_dt.empty: return None

    #bertlog.debug("--> LINE %d, TABLE user_visit_seqid_dt : \n%s", LINE(), user_visit_seqid_dt)
    time1 = user_visit_seqid_dt['dateTaken'].min()
    time2 = user_visit_seqid_dt['dateTaken'].max()
    secs = time2 - time1 + 1
    #bertlog.debug("--> LINE %d, secs: %d", LINE(), secs)

    ### ITERNINARY MUST BE AT LEAST 15 mins
    #if secs < 15 * 60: continue

    #bertlog.debug("--> LINE %d, mins: %d", LINE(), int(secs/60))

    #assert(secs >= 15)
    assert(time1 and time2)

    numpois = len(poi2theme.keys())
    p0,pn = hist_pois[0], hist_pois[-1]
    t0,tn = poi2theme[p0], poi2theme[pn]

    #bertlog.debug("--> LINE %d, p0: %d,  t0: %s", LINE(), p0, t0)
    #bertlog.debug("--> LINE %d, pn: %d,  tn: %s", LINE(), pn, tn)
    #bertlog.debug("--> LINE %d, %d secs,  nan:%s", LINE(), secs, str(math.isnan(secs)))

    assert(not math.isnan(secs))
    assert(bertmodel)
    ### estimate user / PREDICTION
    (predict_user_pid_theme, duration) = predict_user(bertmodel, pois, u,    seqid, p0,pn,  t0, tn, secs, hist_pois)
    assert(predict_user_pid_theme[0] != '')
    assert(predict_user_pid_theme[1] != '')
    assert(predict_user_pid_theme[2] != '')
    assert(predict_user_pid_theme[3] != '')
    if duration:
        pass
    else:
        duration=0
    #bertlog.debug("LINE %d,  predict_user(... u:'%s', seqid='%d', p0:%d, pn:%d, t0:%s, tn:%s, secs:%d, hist_pois)", LINE(),u,seqid, p0,pn,t0,tn, secs)
    #bertlog.debug("line %d, [USER/POI/Theme] => (predict_user_pid_theme, duration) => %s, %s", LINE(),str(predict_user_pid_theme), duration)
    theme_seq = predict_user_pid_theme[2::3]
    bertlog.debug("line %d, themes : %s", LINE(), theme_seq)

    # predict_user_pid_theme[0]: USER_ID
    # predict_user_pid_theme[1]: HOMETOWN
    # predict_user_pid_theme[2]: POI-ID
    # predict_user_pid_theme[3]: POI-THEME
    print("LINE 951, predict_user_pid_theme : ", str(predict_user_pid_theme))
    print("LINE 952, predict_user_pid_theme[2]  : ", predict_user_pid_theme[2])
    print("LINE 953, predict_user_pid_theme[-2] : ", predict_user_pid_theme[-2])
    assert( int(predict_user_pid_theme[2]) == int(p0) )
    assert( int(predict_user_pid_theme[-2]) == int(pn) )

    #predictstr=predict_user_pid_theme[1::3]
    #predictstr=predict_user_pid_theme
    if not (predict_user_pid_theme): return None
    if not (duration): return None

    #bertlog.debug("==> LINE %d, user : %s", LINE(), u)
    #bertlog.debug("==> LINE %d, seqid: %d", LINE(), seqid)

    predictstr = predict_user_pid_theme[2::4]

    #bertlog.debug("==> LINE %d, predicted: %s", LINE(), predictstr)
    #bertlog.debug("==> LINE %d, duration: %s", LINE(), str(duration))
    #bertlog.debug("==> LINE %d, %d secs, nan?..%s", LINE(), secs, str(math.isnan(secs)))
    #bertlog.debug("==> LINE %d, PREDICTED SEQ : %s", LINE(), predictstr)
    #bertlog.debug("==> LINE %d, duration : %d", LINE(), int(duration))

    hist_pois = [ int(pid) for pid in hist_pois ]
    pred_pois = [ int(pid) for pid in predictstr ]
    #bertlog.debug("==> LINE %d, TRYJECTORY : %s", LINE(), hist_pois)
    #bertlog.debug("==> LINE %d, PREDICTION : %s", LINE(), pred_pois)


    ### CALC F1 SCORES
    # if predictstr and len(predictstr) >= 6:
    if len(hist_pois) and len(pred_pois):
        ### calc f1 score
        # pred_pois = predictstr[1::3]
        # pred_pois = [ int(pid)   for pid   in predictstr ]
        # hist_pois = [ int(poiid) for poiid in hist_pois ]
        assert(hist_pois[ 0]==pred_pois[ 0])
        assert(hist_pois[-1]==pred_pois[-1])
        #print("LINE_1018 ... duration: {}, hist_pois:{}, "  .format(secs, hist_pois))
        #print("LINE_1019 ... duration: {}, pred_pois:{}\n\n".format(duration, pred_pois))

        #bertlog.debug("LINE %d: userid:%s, seqid:%d, hist_pois -> %s", LINE(), u, seqid, hist_pois)
        #bertlog.debug("LINE %d: userid:%s, seqid:%d, pred_pois -> %s", LINE(), u, seqid, pred_pois)

        p,r,f = f1_scores(hist_pois, pred_pois)

        bertlog.info("LINE %d, SCORES... u:%s, tryj:%s, hist_pois:%s ... p/r/f1 ( %f, %f, %f )",\
            LINE(), u, str(hist_pois), str(hist_pois), 100*p, 100*r, 100*f)
        bertlog.info("LINE %d, SCORES... u:%s, tryj:%s, pred_pois:%s ... p/r/f1 ( %f, %f, %f )",\
            LINE(), u, str(hist_pois), str(pred_pois), 100*p, 100*r, 100*f)
        #scores.append((100*p, 100*r, 100*f))
        return (100*p, 100*r, 100*f)
    #bertlog.debug("LINE %d, END OF USERID => %s, SEQ_ID => %d", LINE(), u, seqid)
    assert(False)

def test_user_preference(city, epochs,  boot_duration, pois, userVisits, testVisits, bertmodel):
    bertlog.info("LINE %d -- test_user_preference( city='%s', epochs=%d,  boot_duration, pois,userVisits)", LINE(),city,epochs)
    bertlog.info("LINE %d -- bertmodel : %s", LINE(), bertmodel)
    assert(bertmodel)

    scores=[]
    # for funt in dir(bertmodel): bertlog.debug(" bertmodel.%s()",str(funt))
    #2023-0#2023-04-03 20:57:46,061 |DEBUG-predict_user| LINE:650 *** FINAL ret_predited_arr : ['Austria Vienna', 'Austria Vienna', 'Austria Vienna', 'Austria Vienna', 'Austria Vienna', 'Austria Vienna', 'Austria Vienna', 'Austria Vienna', 'Austria Vienna', 'Austria Vienna', 'Austria Vienna'] ***1-26 11:21:57,143 |DEBUG-test_user_preference|  bertmodel.args()
    # .compute_metrics()
    # .config()
    # .convert_to_onnx()
    # .device()
    # .eval_model()
    # .evaluate()
    # .get_named_parameters()
    # .is_sweeping()
    # .load_and_cache_examples()
    # .loss_fct()
    # .model()
    # .num_labels()
    # .predict()
    # .results()
    # .save_model()
    # .save_model_args()
    # .tokenizer()
    # .train()
    # .train_model()
    # .weight()

    #bertlog.debug(" bertmodel.model() => %s",str(bertmodel.model()))
    #bertlog.debug(" bertmodel.num_labels() => %d", bertmodel.num_labels())

    #bertlog.debug("LINE %d bertmodel, bertmodel: %s", LINE(), str(bertmodel))

    ### TEST USER
    test_users = sorted(testVisits['userID'].unique())

    for u in reversed(sorted(test_users)):
        #print('\n\n\n------------------------------------------------')
        #print('---  test_user_preference -- user : ', u)
        #print('------------------------------------------------')
        bertlog.info("==> LINE %d, - TEST/EVAL USER: %s", LINE(), u)

        user_visit=testVisits[ testVisits['userID'] == u ]
        #bertlog.debug("==> LINE %d, u:%s, user_visit (%s): \n%s\n", LINE(), u, user_visit.shape, user_visit)

        seqids = sorted( user_visit["seqID"].unique() )
        #bertlog.debug('==> LINE %d, userid: %s, seqids: %s', LINE(), u, str(seqids))

        #bertlog.debug("==> LINE %d, START OF USERID => %s", LINE(), u)
        for seqid in seqids:
            assert(bertmodel)
            seq_f1scores = test_user_preference_seqid(city, epochs, u, seqid, boot_duration, pois, testVisits, bertmodel)
            assert(bertmodel)

            if seq_f1scores:
                bertlog.info("LINE %d, seq_scores : %s", LINE(), str(seq_f1scores))
                p,r,f = seq_f1scores
                scores.append( seq_f1scores )
            ### END FOR SEQID
        ### END FOR USER u
        #bertlog.debug("==> LINE %d, END OF USERID => %s", LINE(), u)

    #bertlog.debug("LINE %d, scores : => %s", LINE(), str(scores))
    for i in range(len(scores)):
        print("LINE {}, scores [ {} ] => {}".format(LINE(), i, str(scores[i])))

    ### TEST ALL USERs
    # scores[ (precision,recall,f1),...]
    # return scores
    # eval_scores = scores[ (precision,recall,f1),...]
    bertlog.info("eval_scores : %d f1/recall/precision score(s)", len(scores))
    bertlog.info("eval_scores : %s", str(scores))

    for (p,r,f1) in scores: bertlog.info( "line %d -->  score: ( f1:%0.5f, recall:%0.5f, prec:%0.5f )", LINE(), f1, r, p )

    arr = dict()
    arr['F1']        = np.mean([f1 for (_,_,f1) in scores])
    arr['Recall']    = np.mean([ r for (_,r,_) in scores])
    arr['Precision'] = np.mean([ p for (p,_,_) in scores])
    return arr

def train_user_bert(epochs, model_str, subseqs, use_cuda=True):
    # e.g. subseqs[1] ==> ['77526889', 2, 'Amusement', '77526889', 1, 'Amusement']

    model_args = ClassificationArgs()
    # model_args.optimizer = ...
    model_args.no_deprecation_warning=True
    model_args.num_train_epochs = epochs
    model_args.reprocess_input_data = True,
    model_args.overwrite_output_dir = True
    model_args.disable_tqdm = True
    model_args.use_multiprocessing = True
    model_args.use_early_stopping = True
    model_args.early_stopping_delta = 0.001
    model_args.early_stopping_metric = "mcc"
    model_args.early_stopping_metric_minimize = False
    model_args.early_stopping_patience = 5
    model_args.evaluate_during_training_steps = 5
    model_args.use_multiprocessing = True
    model_args.use_multiprocessing_for_evaluation = True
    model_args.use_multiprocessed_decoding = True
    model_args.no_deprecation_warning=True
    ### output / save disk space
    model_args.save_steps = -1
    model_args.save_model_every_epoch = False

    #bertlog.debug("LINE %d, FUNC: model_args.output_dir : %s".format(LINE(), model_args.output_dir))
    model_args.disable_tqdm = True

    LABEL_TYPE, MODEL_NAME = get_bertmodel(model_str)

    train_data=[] # ["1,2,3,4","user1"], ["4,3,2,1","user2"]]

    userids = sorted(set([ s[0] for s in subseqs ]))
    num2user = dict()
    user2num = dict()
    for u in userids:
        n=len(num2user)
        num2user[n] = u
        user2num[u] = n
        print("num2user[{}] = {}, user2num[{}] = {}".format(n,u,u,n))

    for i in num2user: print("  num2user[ {} ] ==> {}".format(i,num2user[i]))
    for u in user2num: print("  user2num[ {} ] ==> {}".format(u,user2num[u]))

    for i in range(len(subseqs)):
        seq=subseqs[i]
        uid = seq[0]

        train_data.append([ "{},{}".format(str(seq[1]),str(seq[-2])), user2num[uid]])
        print("    subseq => {}".format(train_data[-1]))

    print("\n\n userids : ", ", ".join(userids))
    assert(len(set(userids)) == len(num2user.keys()))
    assert(len(set(userids)) == len(user2num.keys()))

    train_df = pd.DataFrame(train_data)
    train_df.columns = ["text", "labels"]
    print(train_df)

    NUM_LABELS = len( set(userids ) )
    print("NUM_LABELS : ", NUM_LABELS)

    ### MAKE CLASSIFCATION
    usermodel = ClassificationModel(
        model_type=  LABEL_TYPE, \
        model_name=  MODEL_NAME, \
        num_labels=  NUM_LABELS, \
        use_cuda=    use_cuda,   \
        #cuda_device= 1,          \
        args=        model_args)
    usermodel.train_model(train_df, no_deprecation_warning=True)
    print(" USER_MODEL : ", usermodel)

    ### TEST
    results,raw_results = usermodel.predict( ['21,8'])
    print("\nresult : ", results[0])
    print("\nraw_results : \n", raw_results[0])

    return user2num, num2user, usermodel

def main(bert, city, epochs, USE_CUDA=True):
    # read in from  spmf.sh /
    ### for city in ['Buda','Delh','Edin','Glas','Osak','Pert','Toro']
    #e = args.epochs
    (pois,  userVisits, evalVisits, testVisits) = load_dataset( city, DEBUG=1 )

    bertlog.info( "  [[[[[ userVisits.shape : %s ]]]]]", str(userVisits.shape))
    bertlog.info( "  [[[[[ evalVisits.shape : %s ]]]]]", str(evalVisits.shape))
    bertlog.info( "  [[[[[ testVisits.shape : %s ]]]]]", str(testVisits.shape))

    # combine all 3
    all_visits = pd.concat([userVisits, evalVisits, testVisits], axis=0)

    boot_duration = inferPOITimes2(pois, all_visits, alpha_pct=90)
    print(boot_duration)

    setting['bootstrap_duration'] = boot_duration
    assert(setting['bootstrap_duration'])

    dist_dict = distance_dict(pois)
    theme2num, num2theme, poi2theme = get_themes_ids(pois)

    ## TRAINING MAIN MODEL WITH ALL USERS
    ## TRAINING MAIN MODEL WITH ALL USERS
    ## TRAINING MAIN MODEL WITH ALL USERS
    bertmodel, train_df = bert_train_city(city, pois, userVisits, 1, model_str=bert, USE_CUDA=USE_CUDA)
    assert(bertmodel)

    for iter in range(epochs+1):
        # retrain
        bertmodel.train_model(train_df, no_deprecation_warning=False)
        if (1+iter) in [1,5,10,15,20,30,40,50,60,70,80,90]:
            # eval
            ## STEP-C EVALUATION
            print( "  PART [3] EVALUATION")
            print( "  PART [3] EVALUATION")
            print( "  PART [3] EVALUATION")
            assert(bertmodel)
            eval_scores = test_user_preference( city, iter,  boot_duration, pois, userVisits, evalVisits, bertmodel)
            assert(bertmodel)
            bertlog.info("EVAL F1 scores, bert: %s, city: %s, epochs: %d precision: %0.5f recall: %0.5f f1: %0.5f", \
                         bert, city, iter+1, eval_scores['Precision'], eval_scores['Recall'], eval_scores['F1'])

            ## STEP-D TESTING
            # TESTING
            print( "  PART [4] TESTING")
            print( "  PART [4] TESTING")
            print( "  PART [4] TESTING")
            #bertlog.debug( "LINE %d, PART [4] main TESTINGN -->  bert_test_ city(city, pois, model, testVisits) --> %s".format(LINE(), str(bertmodel)))
            test_scores = test_user_preference( city, epochs,  boot_duration, pois, userVisits, testVisits, bertmodel)
            bertlog.info("TEST F1 scores, bert: %s, city: %s, epochs: %d precision: %0.5f recall: %0.5f f1: %0.5f", \
                        bert, city, iter+1, test_scores['Precision'], test_scores['Recall'], test_scores['F1'])

    bertlog.info("LINE %d, EXPERIMENT run with bertmodel : %s", LINE(), str(bertmodel))

    try:
        output_dir = ("/var/tmp/output/output_{}_e{}_{}".format(city, epochs, bert))
        bertlog.info("... removing all output files: %s", output_dir)
        os.remove(output_dir)
    except FileNotFoundError as e:
        bertlog.warning("Cannot remove folder: '%s'", output_dir)

    quit(0)
    return

if __name__ == '__main__':
    ## default action for no arguments
    import random
    random.seed(1)
    #print( sys.argv )
    if len(sys.argv) <= 1:
        summary = main( bert="bert", city="Pert", epochs=1)
        print("Testing : \t", summary)
    else:
        parser = argparse.ArgumentParser()
        parser.add_argument('--city',     '-c', type=str, required=True)
        parser.add_argument('--epochs',   '-e', type=int, required=True)
        parser.add_argument('--cuda', default=False, action=argparse.BooleanOptionalAction, help='Using CUDA GPU')
        parser.add_argument('--model',    '-m', type=str, required=False, default='bert', help='BERT-like module (bert/albert/roberta)')
        args = parser.parse_args()
        e = args.epochs
        bertlog.info("RUN: %s", args)
        summary_eval,summary_test = main( bert=args.model, city=args.city, epochs=args.epochs, USE_CUDA=args.cuda)
        print("Evaluation : \t", summary_eval)
        print("Testing : \t", summary_test)
    quit(0)

